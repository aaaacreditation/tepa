#!/usr/bin/env node
/* Creates the Import conversion actions the pipeline stages report against.

     npm run ads:actions             show what exists and what is missing
     npm run ads:actions -- --create create the missing ones

   Offline conversion imports can only be received by a conversion action of
   type UPLOAD_CLICKS. The account's existing TEPA actions are type WEBPAGE,
   which fire from a browser on a thank you page and silently cannot accept an
   upload, so the stages need their own actions rather than reusing those.

   Matching is by name, so re-running never creates a duplicate.

   This talks to the Google Ads API, not Data Manager. Creating a conversion
   action is account administration and still lives there; only the conversion
   upload itself moved. That is why this script needs the developer token and
   the adwords scope, while the app at runtime needs neither. */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const ROOT = resolve(import.meta.dirname, "..");
const API = "https://googleads.googleapis.com/v25";
const CREATE = process.argv.includes("--create");

/* --primary=<stage> promotes one stage to the primary conversion goal and
   demotes the rest to secondary.

   Smart Bidding optimises against primary goals only, and needs roughly 30
   conversions a month to learn. A campaign that reports only customers gives it
   two or three delayed signals a month and it never leaves the learning phase,
   so the ladder is walked upward as volume allows: enquiry first, then mql,
   then sql, then customer. Every stage keeps reporting regardless, so the
   history is already there when the next one is promoted.

   Expect one to two weeks of unstable performance after each switch while
   bidding relearns, so do not climb the ladder more often than that. */
const primaryArg = process.argv.find((a) => a.startsWith("--primary="));
const PRIMARY_STAGE = primaryArg ? primaryArg.split("=")[1].trim().toLowerCase() : "";

loadEnv(".env.local");

const digits = (v) => (v ?? "").replace(/\D/g, "");
const clientId = (process.env.GOOGLE_ADS_CLIENT_ID ?? "").trim();
const clientSecret = (process.env.GOOGLE_ADS_CLIENT_SECRET ?? "").trim();
const refreshToken = (process.env.GOOGLE_ADS_REFRESH_TOKEN ?? "").trim();
const devToken = (process.env.GOOGLE_ADS_DEVELOPER_TOKEN ?? "").trim();
const customerId = digits(process.env.GOOGLE_ADS_CUSTOMER_ID);
const loginCustomerId = digits(process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID);

const missing = [];
if (!clientId) missing.push("GOOGLE_ADS_CLIENT_ID");
if (!clientSecret) missing.push("GOOGLE_ADS_CLIENT_SECRET");
if (!refreshToken) missing.push("GOOGLE_ADS_REFRESH_TOKEN");
if (!devToken) missing.push("GOOGLE_ADS_DEVELOPER_TOKEN");
if (!customerId) missing.push("GOOGLE_ADS_CUSTOMER_ID");
if (missing.length) {
  console.error(`\nMissing in .env.local: ${missing.join(", ")}\n`);
  process.exit(1);
}

/* Values are the defaults the app falls back to, so the account and the code
   agree out of the box. alwaysUseDefaultValue stays false: the upload sends a
   per lead value and that must win over the account default. */
const WANTED = [
  {
    envVar: "GOOGLE_ADS_ACTION_LEAD",
    name: "TEPA Enquiry",
    category: "SUBMIT_LEAD_FORM",
    /* The enquiry is worth nothing until it qualifies, so the later stages
       carry the value. Reporting it still matters: customers take weeks to
       close, and without this Google has almost no signal to learn from in
       the opening weeks of a campaign. */
    value: 0,
    primary: false,
  },
  {
    envVar: "GOOGLE_ADS_ACTION_MQL",
    name: "TEPA MQL",
    category: "QUALIFIED_LEAD",
    value: 50,
    /* Secondary. Observed and reported, but kept out of bidding so the mid
       funnel does not pull optimisation away from actual customers. */
    primary: false,
  },
  {
    envVar: "GOOGLE_ADS_ACTION_SQL",
    name: "TEPA SQL",
    category: "QUALIFIED_LEAD",
    value: 250,
    primary: false,
  },
  {
    envVar: "GOOGLE_ADS_ACTION_CUSTOMER",
    name: "TEPA Customer",
    category: "CONVERTED_LEAD",
    value: 2000,
    /* Where the ladder ends, once customer volume can sustain bidding on its
       own. For a high ticket service that may never happen, in which case sql
       is the sensible resting place. */
    primary: false,
  },
];

/* The stage bidding optimises against at the start. Overridden by --primary. */
const DEFAULT_PRIMARY = "lead";

const stageOf = (envVar) => envVar.replace("GOOGLE_ADS_ACTION_", "").toLowerCase();

if (PRIMARY_STAGE && !WANTED.some((w) => stageOf(w.envVar) === PRIMARY_STAGE)) {
  console.error(
    `\n--primary must be one of: ${WANTED.map((w) => stageOf(w.envVar)).join(", ")}\n`,
  );
  process.exit(1);
}

const primaryStage = PRIMARY_STAGE || DEFAULT_PRIMARY;
for (const want of WANTED) want.primary = stageOf(want.envVar) === primaryStage;

const token = await accessToken();

console.log("\nTEPA conversion actions");
console.log("=".repeat(46));
console.log(`Account: ${customerId}${loginCustomerId ? ` (via MCC ${loginCustomerId})` : ""}\n`);

console.log(`Primary goal: ${primaryStage}\n`);

const existing = await search(
  `SELECT conversion_action.id, conversion_action.name, conversion_action.type,
          conversion_action.status, conversion_action.primary_for_goal
   FROM conversion_action
   WHERE conversion_action.status != 'REMOVED'`,
);

const byName = new Map(
  existing.map((r) => [r.conversionAction.name, r.conversionAction]),
);

const resolved = {};
const toCreate = [];
const toRepoint = [];

for (const want of WANTED) {
  const found = byName.get(want.name);
  if (!found) {
    toCreate.push(want);
    console.log(`MISSING  ${want.name}`);
    continue;
  }
  if (found.type !== "UPLOAD_CLICKS") {
    /* A name collision with a browser side action would be reported against
       something that cannot receive the upload, so refuse rather than adopt. */
    console.log(
      `CONFLICT ${want.name} exists but is type ${found.type}, not UPLOAD_CLICKS. Rename it in Google Ads.`,
    );
    continue;
  }
  resolved[want.envVar] = found.id;
  const isPrimary = Boolean(found.primaryForGoal);
  const label = want.primary ? "PRIMARY" : "secondary";
  if (isPrimary !== want.primary) {
    toRepoint.push({ id: found.id, name: want.name, primary: want.primary });
    console.log(
      `CHANGE   ${want.name.padEnd(16)} id ${found.id}  ${isPrimary ? "PRIMARY" : "secondary"} -> ${label}`,
    );
  } else {
    console.log(`EXISTS   ${want.name.padEnd(16)} id ${found.id}  ${label}`);
  }
}

/* Repointing which stage drives bidding is the whole point of walking the
   ladder, so it happens whether or not anything needs creating. */
if (toRepoint.length > 0) {
  if (!CREATE) {
    console.log(`\n${toRepoint.length} goal change(s) pending. Re-run with --create to apply.\n`);
    process.exit(0);
  }
  const ops = toRepoint.map((r) => ({
    update: {
      resourceName: `customers/${customerId}/conversionActions/${r.id}`,
      primaryForGoal: r.primary,
    },
    updateMask: "primaryForGoal",
  }));
  console.log("\nApplying goal changes...");
  await mutate(ops, true);
  await mutate(ops, false);
  for (const r of toRepoint) {
    console.log(`UPDATED  ${r.name.padEnd(16)} -> ${r.primary ? "PRIMARY" : "secondary"}`);
  }
  console.log(
    "\nSmart Bidding will relearn for one to two weeks. Expect unstable\n" +
      "performance in that window, and do not change the goal again inside it.",
  );
}

if (toCreate.length === 0) {
  report();
  process.exit(0);
}

if (!CREATE) {
  console.log(`\n${toCreate.length} to create. Re-run with --create to make them:\n`);
  for (const w of toCreate) {
    console.log(
      `  ${w.name.padEnd(16)} Import / ${w.category} / $${w.value} / ${w.primary ? "Primary" : "Secondary"}`,
    );
  }
  console.log("");
  process.exit(0);
}

/* Validate the whole batch before writing anything, so a rejected field cannot
   leave half the stages created. */
const operations = toCreate.map((w) => ({
  create: {
    name: w.name,
    type: "UPLOAD_CLICKS",
    category: w.category,
    status: "ENABLED",
    primaryForGoal: w.primary,
    /* One organization accrediting is one conversion, not one per program. */
    countingType: "ONE_PER_CLICK",
    valueSettings: {
      defaultValue: w.value,
      defaultCurrencyCode: process.env.GOOGLE_ADS_CURRENCY || "USD",
      alwaysUseDefaultValue: false,
    },
  },
}));

console.log("\nValidating...");
await mutate(operations, true);
console.log("Validated. Creating...");
const results = await mutate(operations, false);

results.forEach((res, i) => {
  const id = String(res.resourceName).split("/").pop();
  resolved[toCreate[i].envVar] = id;
  console.log(`CREATED  ${toCreate[i].name.padEnd(16)} id ${id}`);
});

report();

function report() {
  const lines = WANTED.map((w) => `${w.envVar}=${resolved[w.envVar] ?? ""}`);
  console.log("\n" + "=".repeat(46));
  console.log("Paste into .env.local:\n");
  for (const line of lines) console.log(line);
  console.log("\nThen: npm run ads:check\n");
}

/* ------------------------------------------------------------- helpers */

async function accessToken() {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok || !body.access_token) {
    console.error("\nOAuth failed:", JSON.stringify(body));
    process.exit(1);
  }
  return body.access_token;
}

function headers() {
  const h = {
    Authorization: `Bearer ${token}`,
    "developer-token": devToken,
    "Content-Type": "application/json",
  };
  if (loginCustomerId) h["login-customer-id"] = loginCustomerId;
  return h;
}

async function search(query) {
  const res = await fetch(`${API}/customers/${customerId}/googleAds:search`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({ query }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    console.error("\nQuery failed:", JSON.stringify(body).slice(0, 800));
    process.exit(1);
  }
  return body.results ?? [];
}

async function mutate(operations, validateOnly) {
  const res = await fetch(`${API}/customers/${customerId}/conversionActions:mutate`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({ operations, validateOnly }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    console.error("\nMutate failed:", JSON.stringify(body).slice(0, 1200));
    process.exit(1);
  }
  return body.results ?? [];
}

function loadEnv(file) {
  let raw;
  try {
    raw = readFileSync(resolve(ROOT, file), "utf8");
  } catch {
    return;
  }
  for (const line of raw.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = value;
  }
}
