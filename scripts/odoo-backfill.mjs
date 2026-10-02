/**
 * Copy the leads that predate the Odoo sync into the CRM.
 *
 *   node scripts/odoo-backfill.mjs                 # dry run: counts only
 *   node scripts/odoo-backfill.mjs --apply         # queue them for the sync
 *
 * Options:
 *   --include-duplicated   also copy leads sales marked "duplicated"
 *   --no-nurture           tag nobody for the welcome sequence
 *
 * The dry run reads the leads table and searches Odoo, and writes nothing to
 * either. --apply writes only to this app's own odoo_sync outbox, one row per
 * lead with origin 'backfill'; the app's drain (lib/odoo.ts) then does the
 * Odoo side exactly as it does for a new enquiry, so there is one code path
 * that writes to the CRM, not two. Drain it with the timer, or by hand:
 *
 *   curl -X POST -H "Authorization: Bearer $CONVERSIONS_CRON_SECRET" \
 *     "http://127.0.0.1:3000/api/conversions/process?limit=25"
 *
 * Matching is on email, against active and archived Odoo records alike: many
 * of these leads were entered by hand already, and those are linked, never
 * copied again or written to. A lead is tagged for nurture only if it arrived
 * in the last 7 days, asked to be contacted by email, and Odoo did not know
 * the address — anyone older was contacted by sales already, and a "welcome"
 * a week late is worse than none.
 *
 * Prints counts only. No name, email or phone number reaches the terminal.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const apply = process.argv.includes("--apply");
const includeDuplicated = process.argv.includes("--include-duplicated");
const noNurture = process.argv.includes("--no-nurture");

const NURTURE_DAYS = 7;

/* Same search order as scripts/leads-report: on the server .env.local is a
   symlink to /opt/tepa/app/.env. The Odoo settings live beside it in
   .env.production.local, kept apart so adding them never touched the file
   that holds the database and ad platform credentials; Next loads both. */
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const envPath = [process.env.TEPA_ENV_FILE, path.join(root, ".env.local"), "/opt/tepa/app/.env"]
  .filter(Boolean)
  .find((file) => fs.existsSync(file));
if (!envPath) {
  console.error("No env file found.");
  process.exit(1);
}
const readEnv = (file) =>
  Object.fromEntries(
    fs
      .readFileSync(file, "utf8")
      .split("\n")
      .filter((line) => line.includes("=") && !line.trim().startsWith("#"))
      .map((line) => {
        const at = line.indexOf("=");
        return [line.slice(0, at).trim(), line.slice(at + 1).trim().replace(/^["']|["']$/g, "")];
      }),
  );
const overlay = path.join(root, ".env.production.local");
const env = { ...readEnv(envPath), ...(fs.existsSync(overlay) ? readEnv(overlay) : {}) };

const missing = ["DATABASE_URL", "ODOO_URL", "ODOO_DB", "ODOO_API_KEY"].filter((key) => !env[key]);
if (missing.length > 0) {
  console.error(`Missing in ${envPath}: ${missing.join(", ")}`);
  process.exit(1);
}

async function odoo(model, method, body) {
  const response = await fetch(`${env.ODOO_URL.replace(/\/+$/, "")}/json/2/${model}/${method}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `bearer ${env.ODOO_API_KEY}`,
      "X-Odoo-Database": env.ODOO_DB,
    },
    body: JSON.stringify(body),
  });
  if (!response.ok) throw new Error(`Odoo ${model}.${method} ${response.status}`);
  return response.json();
}

/* Mirrors contactMethodOf() in lib/odoo.ts. */
const contactMethodOf = (message) =>
  /Preferred contact:\s*(WhatsApp|Phone call|Email)\b/.exec(message)?.[1] ?? "";

const client = new pg.Client({
  connectionString: env.DATABASE_URL,
  ssl: /sslmode=require/.test(env.DATABASE_URL) ? { rejectUnauthorized: false } : undefined,
});
await client.connect();

/* Leads the sync has never seen: no outbox row, so not an enquiry made after
   go-live and not queued by an earlier run of this script. */
const { rows: leads } = await client.query(
  `SELECT l.id, l.source, l.status, lower(trim(l.email)) AS email, l.message,
          l.created_at >= now() - make_interval(days => $1) AS recent
   FROM leads l
   WHERE NOT l.is_demo
     AND NOT EXISTS (SELECT 1 FROM odoo_sync s WHERE s.lead_id = l.id)
   ORDER BY l.created_at ASC`,
  [NURTURE_DAYS],
);

const skippedDuplicated = includeDuplicated ? [] : leads.filter((l) => l.status === "duplicated");
const candidates = includeDuplicated ? leads : leads.filter((l) => l.status !== "duplicated");

const emails = [...new Set(candidates.map((l) => l.email))];
const known = new Set();
for (let i = 0; i < emails.length; i += 150) {
  const batch = emails.slice(i, i + 150);
  const found = await odoo("crm.lead", "search_read", {
    domain: [
      ["email_normalized", "in", batch],
      ["active", "in", [true, false]],
    ],
    fields: ["email_normalized"],
  });
  for (const record of found) known.add(record.email_normalized);
}

/* One Odoo record per person. The oldest row of an email creates it and the
   rest link to it, so the nurture decision is made per email, from the most
   recent enquiry. */
const latestByEmail = new Map();
for (const lead of candidates) latestByEmail.set(lead.email, lead);
const nurtureEmails = new Set(
  noNurture
    ? []
    : [...latestByEmail.values()]
        .filter((l) => !known.has(l.email) && l.recent && contactMethodOf(l.message) === "Email")
        .map((l) => l.email),
);

const tally = (items, key) =>
  items.reduce((acc, item) => ((acc[key(item)] = (acc[key(item)] ?? 0) + 1), acc), {});
const people = [...latestByEmail.values()];
const newPeople = people.filter((l) => !known.has(l.email));

console.log(apply ? "APPLY: queueing for the Odoo sync" : "DRY RUN: nothing is written");
console.log({
  leadsNotYetSynced: leads.length,
  skippedAsDuplicated: skippedDuplicated.length,
  rowsToQueue: candidates.length,
  people: people.length,
  alreadyInOdoo: people.length - newPeople.length,
  willBeCreated: newPeople.length,
  willBeCreatedBySource: tally(newPeople, (l) => l.source),
  willBeNurtured: nurtureEmails.size,
});

if (apply && candidates.length > 0) {
  let queued = 0;
  for (const lead of candidates) {
    const result = await client.query(
      `INSERT INTO odoo_sync (lead_id, origin, nurture)
       VALUES ($1, 'backfill', $2)
       ON CONFLICT (lead_id) DO NOTHING`,
      [lead.id, nurtureEmails.has(lead.email)],
    );
    queued += result.rowCount;
  }
  console.log(`Queued ${queued} leads. The drain sends them to Odoo, 25 per run.`);
}

await client.end();
