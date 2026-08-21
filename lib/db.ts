import "server-only";
import { Pool } from "pg";
import { hashPassword } from "./auth";

/* One pool per process. The globalThis cache keeps dev hot reloads from
   opening a new pool on every file change. */
declare global {
  var __aaaLeadsPool: Pool | undefined;
  var __aaaLeadsSchemaReady: Promise<void> | undefined;
}

const SCHEMA = `
CREATE TABLE IF NOT EXISTS dashboard_users (
  id            SERIAL PRIMARY KEY,
  email         TEXT NOT NULL UNIQUE,
  name          TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS leads (
  id                SERIAL PRIMARY KEY,
  source            TEXT NOT NULL,
  full_name         TEXT NOT NULL,
  organization      TEXT NOT NULL DEFAULT '',
  email             TEXT NOT NULL,
  country_code      TEXT NOT NULL DEFAULT '',
  country_name      TEXT NOT NULL DEFAULT '',
  phone             TEXT NOT NULL DEFAULT '',
  website           TEXT NOT NULL DEFAULT '',
  message           TEXT NOT NULL DEFAULT '',
  status            TEXT NOT NULL DEFAULT 'lead'
                    CHECK (status IN ('lead', 'mql', 'sql', 'customer')),
  notes             TEXT NOT NULL DEFAULT '',
  is_demo           BOOLEAN NOT NULL DEFAULT false,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  status_changed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS leads_source_created_idx ON leads (source, created_at DESC);

CREATE TABLE IF NOT EXISTS lead_events (
  id          SERIAL PRIMARY KEY,
  lead_id     INTEGER NOT NULL REFERENCES leads (id) ON DELETE CASCADE,
  from_status TEXT NOT NULL,
  to_status   TEXT NOT NULL,
  changed_by  TEXT NOT NULL DEFAULT '',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS lead_events_lead_idx ON lead_events (lead_id, created_at);

/* Ad attribution captured on the landing page and carried through to the
   conversion uploads. Added with ALTER so existing installs migrate in place;
   every column is nullable-free with a '' default so the read paths never
   have to null check. */
ALTER TABLE leads ADD COLUMN IF NOT EXISTS gclid         TEXT NOT NULL DEFAULT '';
ALTER TABLE leads ADD COLUMN IF NOT EXISTS gbraid        TEXT NOT NULL DEFAULT '';
ALTER TABLE leads ADD COLUMN IF NOT EXISTS wbraid        TEXT NOT NULL DEFAULT '';
ALTER TABLE leads ADD COLUMN IF NOT EXISTS utm_source    TEXT NOT NULL DEFAULT '';
ALTER TABLE leads ADD COLUMN IF NOT EXISTS utm_medium    TEXT NOT NULL DEFAULT '';
ALTER TABLE leads ADD COLUMN IF NOT EXISTS utm_campaign  TEXT NOT NULL DEFAULT '';
ALTER TABLE leads ADD COLUMN IF NOT EXISTS utm_term      TEXT NOT NULL DEFAULT '';
ALTER TABLE leads ADD COLUMN IF NOT EXISTS utm_content   TEXT NOT NULL DEFAULT '';
ALTER TABLE leads ADD COLUMN IF NOT EXISTS landing_path  TEXT NOT NULL DEFAULT '';
ALTER TABLE leads ADD COLUMN IF NOT EXISTS referrer      TEXT NOT NULL DEFAULT '';
/* When the click identifier was first seen, not when the form was sent. Google
   matches an offline conversion against the click, so the upload carries the
   form timestamp while this stays available for debugging stale attribution. */
ALTER TABLE leads ADD COLUMN IF NOT EXISTS clicked_at    TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS leads_gclid_idx ON leads (gclid) WHERE gclid <> '';

/* Qualification. The score and tier are computed once at insert time by
   lib/qualification.ts rather than on every dashboard render, so a change to
   the scoring never silently rewrites the history a reviewer has already acted
   on. Every column carries the same '' / 0 default as its neighbours, so the
   leads that predate this still read without a null check and land on tier ''
   — which the dashboard renders as "not scored" rather than as a judgement it
   never made. Reasons are newline joined: short sentences for a human to read,
   never queried.

   organization_type, program_count and contact_role backed three extra form
   questions that were removed for making the form too long. They are kept
   rather than dropped: the columns are empty and cost nothing, dropping them
   is irreversible, and re-adding the questions later would otherwise mean
   another migration. Nothing reads or writes them. */
ALTER TABLE leads ADD COLUMN IF NOT EXISTS organization_type     TEXT NOT NULL DEFAULT '';
ALTER TABLE leads ADD COLUMN IF NOT EXISTS program_count         TEXT NOT NULL DEFAULT '';
ALTER TABLE leads ADD COLUMN IF NOT EXISTS contact_role          TEXT NOT NULL DEFAULT '';
ALTER TABLE leads ADD COLUMN IF NOT EXISTS qualification_score   INTEGER NOT NULL DEFAULT 0;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS qualification_tier    TEXT NOT NULL DEFAULT '';
ALTER TABLE leads ADD COLUMN IF NOT EXISTS qualification_reasons TEXT NOT NULL DEFAULT '';

/* Dropped and re-added by name so the pair stays re-runnable, the same way the
   conversion_uploads status check is handled below. '' is a member because
   pre-qualification rows keep it. */
ALTER TABLE leads DROP CONSTRAINT IF EXISTS leads_qualification_tier_check;
ALTER TABLE leads ADD  CONSTRAINT leads_qualification_tier_check
  CHECK (qualification_tier IN ('', 'disqualified', 'weak', 'qualified', 'strong'));

CREATE INDEX IF NOT EXISTS leads_qualification_idx
  ON leads (qualification_tier, created_at DESC)
  WHERE qualification_tier <> '';

/* Outbox for offline conversion uploads. A row is written the moment a lead
   reaches a stage; the sender drains it separately so a Google outage costs a
   retry rather than a lost conversion. dedupe_key is the safety rail: moving a
   lead mql -> lead -> mql re-enters the same key and cannot double count. */
CREATE TABLE IF NOT EXISTS conversion_uploads (
  id            SERIAL PRIMARY KEY,
  lead_id       INTEGER NOT NULL REFERENCES leads (id) ON DELETE CASCADE,
  stage         TEXT NOT NULL CHECK (stage IN ('lead', 'mql', 'sql', 'customer')),
  dedupe_key    TEXT NOT NULL UNIQUE,
  value         NUMERIC(12, 2) NOT NULL DEFAULT 0,
  currency      TEXT NOT NULL DEFAULT 'USD',
  occurred_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  status        TEXT NOT NULL DEFAULT 'pending'
                CHECK (status IN ('pending', 'sending', 'sent', 'failed', 'skipped')),
  attempts      INTEGER NOT NULL DEFAULT 0,
  last_error    TEXT NOT NULL DEFAULT '',
  request_id    TEXT NOT NULL DEFAULT '',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  sent_at       TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS conversion_uploads_pending_idx
  ON conversion_uploads (status, created_at)
  WHERE status IN ('pending', 'sending', 'failed');

CREATE INDEX IF NOT EXISTS conversion_uploads_lead_idx ON conversion_uploads (lead_id);

/* 'sending' marks a row claimed by a sender that is mid flight. Installs
   created before it existed carry the old constraint, so it is replaced by
   name rather than patched. Dropping first keeps the pair re-runnable. */
ALTER TABLE conversion_uploads DROP CONSTRAINT IF EXISTS conversion_uploads_status_check;
ALTER TABLE conversion_uploads ADD  CONSTRAINT conversion_uploads_status_check
  CHECK (status IN ('pending', 'sending', 'sent', 'failed', 'skipped'));

/* Set when a row is claimed, so a sender killed mid upload can be detected
   and its row handed back rather than stranded in 'sending' forever. */
ALTER TABLE conversion_uploads ADD COLUMN IF NOT EXISTS claimed_at TIMESTAMPTZ;
`;

function pool(): Pool {
  if (!globalThis.__aaaLeadsPool) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) throw new Error("DATABASE_URL is not set");
    globalThis.__aaaLeadsPool = new Pool({ connectionString, max: 5 });
  }
  return globalThis.__aaaLeadsPool;
}

async function bootstrap(): Promise<void> {
  const db = pool();
  await db.query(SCHEMA);

  /* First run: create the admin account from env so there is always a way in. */
  const { rows } = await db.query("SELECT count(*)::int AS n FROM dashboard_users");
  if (rows[0].n === 0 && process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD) {
    await db.query(
      `INSERT INTO dashboard_users (email, name, password_hash)
       VALUES ($1, $2, $3) ON CONFLICT (email) DO NOTHING`,
      [
        process.env.ADMIN_EMAIL.toLowerCase(),
        process.env.ADMIN_NAME ?? "Admin",
        hashPassword(process.env.ADMIN_PASSWORD),
      ],
    );
  }
}

function ready(): Promise<void> {
  if (!globalThis.__aaaLeadsSchemaReady) {
    globalThis.__aaaLeadsSchemaReady = bootstrap().catch((error) => {
      globalThis.__aaaLeadsSchemaReady = undefined;
      throw error;
    });
  }
  return globalThis.__aaaLeadsSchemaReady;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
export async function q<T = any>(text: string, params?: unknown[]): Promise<T[]> {
  await ready();
  const result = await pool().query(text, params as any[]);
  return result.rows as T[];
}
