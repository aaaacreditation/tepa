/* Seed the dashboard with clearly marked demo leads so the charts and the
   pipeline have something to show before real traffic arrives.

     npm run demo:seed    insert demo leads (safe to run again, adds more)
     npm run demo:clear   remove every demo lead and its history

   Demo rows carry is_demo = true and never mix with real enquiries. */

import { readFileSync } from "node:fs";
import pg from "pg";

function env(name) {
  if (process.env[name]) return process.env[name];
  try {
    const file = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
    for (const line of file.split("\n")) {
      if (line.startsWith(`${name}=`)) return line.slice(name.length + 1).trim();
    }
  } catch {
    /* fall through */
  }
  return undefined;
}

const DATABASE_URL = env("DATABASE_URL");
if (!DATABASE_URL) {
  console.error("DATABASE_URL is not set (checked env and .env.local)");
  process.exit(1);
}

const pool = new pg.Pool({ connectionString: DATABASE_URL });

/* Same DDL the app applies on boot (keep in sync with lib/db.ts) so seeding
   works on a fresh database before the app has ever run. */
await pool.query(`
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
                    CHECK (status IN ('lead', 'mql', 'sql', 'customer', 'not_qualified')),
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

ALTER TABLE leads DROP CONSTRAINT IF EXISTS leads_status_check;
ALTER TABLE leads ADD  CONSTRAINT leads_status_check
  CHECK (status IN ('lead', 'mql', 'sql', 'customer', 'not_qualified'));
ALTER TABLE leads ADD COLUMN IF NOT EXISTS disqualified_reason TEXT NOT NULL DEFAULT '';
ALTER TABLE lead_events ADD COLUMN IF NOT EXISTS reason TEXT NOT NULL DEFAULT '';

/* The attribution columns the demo rows fill, in case this runs against a
   database the app has never booted against. */
ALTER TABLE leads ADD COLUMN IF NOT EXISTS gclid        TEXT NOT NULL DEFAULT '';
ALTER TABLE leads ADD COLUMN IF NOT EXISTS gbraid       TEXT NOT NULL DEFAULT '';
ALTER TABLE leads ADD COLUMN IF NOT EXISTS wbraid       TEXT NOT NULL DEFAULT '';
ALTER TABLE leads ADD COLUMN IF NOT EXISTS fbclid       TEXT NOT NULL DEFAULT '';
ALTER TABLE leads ADD COLUMN IF NOT EXISTS utm_source   TEXT NOT NULL DEFAULT '';
ALTER TABLE leads ADD COLUMN IF NOT EXISTS utm_medium   TEXT NOT NULL DEFAULT '';
ALTER TABLE leads ADD COLUMN IF NOT EXISTS utm_campaign TEXT NOT NULL DEFAULT '';
`);

if (process.argv.includes("--clear")) {
  const { rowCount } = await pool.query("DELETE FROM leads WHERE is_demo");
  console.log(`Removed ${rowCount} demo leads.`);
  await pool.end();
  process.exit(0);
}

const PEOPLE = [
  ["Sarah Mitchell", "Brightpath Learning"],
  ["Omar El Amrani", "Atlas Skills Institute"],
  ["Priya Nair", "Corenext Training"],
  ["James Okafor", "Lagos Business Academy"],
  ["Lucia Fernandez", "Instituto Avanza"],
  ["Chen Wei", "Summit Professional Education"],
  ["Fatima Al Rashid", "Gulf Talent Development"],
  ["Daniel Kim", "Meridian Learning Group"],
  ["Amelia Hart", "Northgate Institute"],
  ["Yusuf Demir", "Anatolia Training Center"],
  ["Grace Mwangi", "Nairobi Skills Hub"],
  ["Tomas Novak", "Praha Education House"],
  ["Hannah Berg", "Nordlicht Akademie"],
  ["Ravi Sharma", "Pinnacle Certification Co"],
  ["Leila Haddad", "Cedar Learning Studio"],
  ["Marco Rossi", "Formazione Prima"],
  ["Anna Kowalska", "Warsaw Training Lab"],
  ["David Ochieng", "East Africa Institute"],
  ["Sofia Marques", "Lisboa Learning"],
  ["Noor Qureshi", "Skyline Education Services"],
  ["Ethan Walsh", "Dublin Provider Group"],
  ["Mei Ling Tan", "Harbourfront Academy"],
];

const COUNTRIES = [
  ["US", "United States"],
  ["GB", "United Kingdom"],
  ["AE", "United Arab Emirates"],
  ["MA", "Morocco"],
  ["NG", "Nigeria"],
  ["IN", "India"],
  ["KE", "Kenya"],
  ["SG", "Singapore"],
  ["ES", "Spain"],
  ["DE", "Germany"],
];

const MESSAGES = [
  "We run leadership and soft skills programs for corporate clients and want international recognition.",
  "Our institute delivers vocational courses to around 400 delegates a year. What does accreditation involve?",
  "Looking to accredit our online certification tracks before our next enrollment cycle.",
  "We already hold a national license and want an international stamp for our diploma programs.",
  "How long does the review usually take? We would like to be accredited before September.",
  "",
];

const STATUS_FLOW = ["lead", "mql", "sql", "customer"];

const REASONS = [
  "Individual, not a training provider",
  "Outside our accreditation scope — asked about a personal certificate",
  "No budget — wants free listing only",
  "Not the decision maker",
  "Spam or test submission",
];

function pick(list) {
  return list[Math.floor(Math.random() * list.length)];
}

function statusFor() {
  const roll = Math.random();
  if (roll < 0.42) return "lead";
  if (roll < 0.62) return "mql";
  if (roll < 0.74) return "sql";
  if (roll < 0.82) return "customer";
  return "not_qualified";
}

/* Attribution shaped like the live traffic: the Meta ads tag every URL, the
   Google campaigns tag none of theirs and are recognised by the click id
   alone, and the rest arrives untagged. See lib/channels.ts. */
function attributionFor() {
  const roll = Math.random();
  const id = Math.random().toString(36).slice(2, 12);
  if (roll < 0.4) {
    return { gclid: `demo-gclid-${id}`, fbclid: "", source: "", medium: "", campaign: "" };
  }
  if (roll < 0.75) {
    return {
      gclid: "",
      fbclid: `demo-fbclid-${id}`,
      source: "facebook",
      medium: "paid",
      campaign: "tepa-ww-sep26",
    };
  }
  return { gclid: "", fbclid: "", source: "", medium: "", campaign: "" };
}

const COUNT = 46;
let inserted = 0;

for (let i = 0; i < COUNT; i++) {
  const [fullName, organization] = pick(PEOPLE);
  const [countryCode, countryName] = pick(COUNTRIES);
  const status = statusFor();
  const attribution = attributionFor();
  const reason = status === "not_qualified" ? pick(REASONS) : "";

  /* Weight creation toward recent days across a 60 day window. */
  const daysAgo = Math.floor(60 * Math.random() * Math.random());
  const hour = 7 + Math.floor(Math.random() * 12);
  const created = new Date();
  created.setDate(created.getDate() - daysAgo);
  created.setHours(hour, Math.floor(Math.random() * 60), 0, 0);

  const slug = organization.toLowerCase().replace(/[^a-z]+/g, "");
  const email = `${fullName.split(" ")[0].toLowerCase()}@${slug}.example.com`;

  const { rows } = await pool.query(
    `INSERT INTO leads
       (source, full_name, organization, email, country_code, country_name,
        phone, website, message, status, is_demo, created_at, status_changed_at,
        disqualified_reason, gclid, fbclid, utm_source, utm_medium, utm_campaign)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, true, $11, $11,
             $12, $13, $14, $15, $16, $17)
     RETURNING id`,
    [
      "tepa",
      fullName,
      organization,
      email,
      countryCode,
      countryName,
      /* Both fields are required on the live form, so every demo row has them. */
      `+1 555 0${100 + Math.floor(Math.random() * 900)}`,
      `${slug}.example.com`,
      pick(MESSAGES),
      status,
      created,
      reason,
      attribution.gclid,
      attribution.fbclid,
      attribution.source,
      attribution.medium,
      attribution.campaign,
    ],
  );

  /* Walk the pipeline history for progressed leads. A disqualified one is
     rejected straight from the lead stage, which is where most of them are
     caught in practice. */
  const stageIndex = STATUS_FLOW.indexOf(status);
  let stamp = new Date(created);
  for (let s = 1; s <= stageIndex; s++) {
    stamp = new Date(stamp.getTime() + (1 + Math.random() * 5) * 86_400_000);
    await pool.query(
      `INSERT INTO lead_events (lead_id, from_status, to_status, changed_by, created_at)
       VALUES ($1, $2, $3, 'Demo seed', $4)`,
      [rows[0].id, STATUS_FLOW[s - 1], STATUS_FLOW[s], stamp],
    );
  }
  if (reason) {
    stamp = new Date(stamp.getTime() + (1 + Math.random() * 3) * 86_400_000);
    await pool.query(
      `INSERT INTO lead_events (lead_id, from_status, to_status, changed_by, reason, created_at)
       VALUES ($1, 'lead', 'not_qualified', 'Demo seed', $2, $3)`,
      [rows[0].id, reason, stamp],
    );
  }
  if (stageIndex > 0 || reason) {
    await pool.query("UPDATE leads SET status_changed_at = $2 WHERE id = $1", [rows[0].id, stamp]);
  }
  inserted++;
}

console.log(`Inserted ${inserted} demo leads for source "tepa".`);
await pool.end();
