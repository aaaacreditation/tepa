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
