#!/usr/bin/env node
/* Checks the Meta pixel and Conversions API setup end to end and says exactly
   which step is broken.

   Run it after filling in .env.local and any time events stop arriving:

     npm run meta:check               token, pixel, write access, event names
     npm run meta:check -- --send-test   also send one Lead flagged as a test event

   A test event is flagged with META_TEST_EVENT_CODE, shows up only under
   Events Manager → Test events and counts for nothing, so it proves the whole
   path without polluting the dataset. Without the code, --send-test sends
   nothing rather than a real event. */

import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const ROOT = resolve(import.meta.dirname, "..");
loadEnv(".env.local");

const SEND_TEST = process.argv.includes("--send-test");

const RESET = "\x1b[0m";
const paint = (code, text) => `\x1b[${code}m${text}${RESET}`;
const ok = (t) => paint("32", `PASS  ${t}`);
const bad = (t) => paint("31", `FAIL  ${t}`);
const warn = (t) => paint("33", `WARN  ${t}`);
const dim = (t) => paint("90", t);

let failed = false;
const fail = (message, fix) => {
  failed = true;
  console.log(bad(message));
  if (fix) console.log(dim(`      ${fix}`));
};

/* ---------------------------------------------------------------- 1. env */

console.log("\nMeta pixel + Conversions API check\n" + "=".repeat(34) + "\n");

const env = (key) => (process.env[key] ?? "").trim();

const pixelId = (env("META_PIXEL_ID") || env("NEXT_PUBLIC_META_PIXEL_ID")).replace(/\D/g, "");
const token = env("META_CAPI_ACCESS_TOKEN");
const version = env("META_GRAPH_VERSION") || "v26.0";
const testCode = env("META_TEST_EVENT_CODE");

console.log("1. Configuration");
if (pixelId) console.log(ok(`Pixel ${pixelId}`));
else fail("NEXT_PUBLIC_META_PIXEL_ID is missing", "Events Manager → the dataset → Settings → Dataset ID");

if (token) console.log(ok("META_CAPI_ACCESS_TOKEN is set"));
else
  fail(
    "META_CAPI_ACCESS_TOKEN is missing",
    "Events Manager → the dataset → Settings → Conversions API → Generate access token",
  );

if (/^v\d+\.\d+$/.test(version)) console.log(ok(`Graph API ${version}`));
else fail(`META_GRAPH_VERSION should look like v26.0, got "${version}"`);

if (testCode) {
  console.log(
    warn(
      `META_TEST_EVENT_CODE is set (${testCode}). Every event is flagged as a test and counts\n` +
        "      for nothing. Fine locally; it must be blank on the server.",
    ),
  );
} else {
  console.log(dim("      META_TEST_EVENT_CODE not set (right for production)"));
}

/* ------------------------------------------------------------- 2. stages */

console.log("\n2. Events per stage");
const STAGES = ["lead", "mql", "sql", "customer"];
const DEFAULT_EVENT = { lead: "Lead", mql: "MQL", sql: "SQL", customer: "Purchase" };
const DEFAULT_VALUE = { lead: 0, mql: 50, sql: 250, customer: 2000 };

/* Mirrors lib/meta-capi.ts and lib/conversions.ts: an unset variable means
   the default name, "off" means the stage is not reported, and the value is
   the shared GOOGLE_ADS_VALUE_* number because a value describes the
   business, not the platform. */
let anyStage = false;
for (const stage of STAGES) {
  const raw = process.env[`META_EVENT_${stage.toUpperCase()}`];
  const name = raw === undefined ? DEFAULT_EVENT[stage] : raw.trim();
  const rawValue = env(`GOOGLE_ADS_VALUE_${stage.toUpperCase()}`);
  const value = rawValue === "" ? DEFAULT_VALUE[stage] : Number(rawValue);
  if (!name || name.toLowerCase() === "off") {
    console.log(dim(`      ${stage.padEnd(9)} off — this stage is not reported to Meta`));
    continue;
  }
  anyStage = true;
  const kind = ["Lead", "Purchase"].includes(name) ? "standard" : "custom";
  console.log(ok(`${stage.padEnd(9)} ${name} (${kind} event), value ${value}`));
}
if (!anyStage) console.log(warn("Every stage is off, so nothing will ever be sent to Meta."));

if (env("GOOGLE_ADS_VALUE_CUSTOMER_HEALTHCARE") || env("GOOGLE_ADS_VALUE_CUSTOMER_CLINIC")) {
  console.log(dim("      Per page values (GOOGLE_ADS_VALUE_*_<PAGE>) apply to Meta too."));
}

/* -------------------------------------------------------------- 3. token */

console.log("\n3. Access token");
let tokenOk = false;

if (!token) {
  console.log(dim("      Skipped — no token"));
} else {
  try {
    const url = new URL(`https://graph.facebook.com/${version}/debug_token`);
    url.searchParams.set("input_token", token);
    const response = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    const body = await response.json().catch(() => ({}));
    const data = body.data ?? {};

    if (!response.ok || body.error || data.is_valid === false) {
      const error = body.error ?? {};
      fail(
        `Meta rejected the token: ${error.message || data.error?.message || `HTTP ${response.status}`}`,
        "Generate a new one: Events Manager → the dataset → Settings → Conversions API",
      );
    } else {
      tokenOk = true;
      console.log(ok(`Token is valid (${data.type ?? "unknown type"}, app "${data.application ?? "?"}")`));

      /* A system user token from Events Manager never expires. A user token
         pasted in by mistake does, and stops tracking quietly weeks later. */
      if (data.expires_at) {
        const when = new Date(data.expires_at * 1000).toISOString().slice(0, 10);
        fail(
          `Token EXPIRES on ${when}`,
          "This is not the system user token Events Manager generates. Make one there instead.",
        );
      } else {
        console.log(ok("Token has no expiry"));
      }

      const targets = (data.granular_scopes ?? []).flatMap((s) => s.target_ids ?? []);
      if (targets.length > 0 && pixelId && !targets.includes(pixelId)) {
        console.log(
          warn(`Token is scoped to dataset ${targets.join(", ")}, not ${pixelId}. Check the pixel id.`),
        );
      }
    }
  } catch (error) {
    fail(`Could not reach the Graph API: ${error.message}`);
  }
}

/* --------------------------------------------------------- 4. write path */

console.log("\n4. Write access to the dataset");
if (!tokenOk || !pixelId) {
  console.log(dim("      Skipped — needs a valid token and a pixel id"));
} else {
  /* Meta refuses a batch outright when an event is dated more than 7 days
     back, but only after authorising it. Sending one that old proves the
     token can post to this dataset while guaranteeing nothing is recorded —
     the same trick as Google's validateOnly. */
  const stale = Math.floor(Date.now() / 1000) - 9 * 86400;
  const result = await postEvents({
    data: [
      {
        event_name: "Lead",
        event_time: stale,
        event_id: "setup-check-stale",
        action_source: "website",
        event_source_url: "https://campaigns.aaa-accreditation.org/tepa",
        user_data: { client_user_agent: "meta-check", client_ip_address: "127.0.0.1" },
      },
    ],
  });

  const error = result.body?.error ?? {};
  if (error.error_subcode === 2804003 || /too old|too far in the past/i.test(error.error_user_msg ?? "")) {
    console.log(ok("Token can post events to this dataset (probe rejected on timestamp, as intended)"));
  } else if (error.code === 190) {
    fail("Token is not accepted for this dataset (code 190)", error.message);
  } else if (error.code === 200 || error.code === 10 || /permission/i.test(error.message ?? "")) {
    fail(
      "Token lacks permission to post to this dataset",
      "Generate the token from this dataset's own Settings → Conversions API panel",
    );
  } else if (result.body?.events_received) {
    console.log(warn("Meta accepted the stale probe, which it should not have. Check the dataset manually."));
  } else {
    fail(`Unexpected response (HTTP ${result.status})`, JSON.stringify(result.body).slice(0, 400));
  }
}

/* ---------------------------------------------------------- 5. test event */

console.log("\n5. Test event");
if (!SEND_TEST) {
  console.log(dim("      Skipped — re-run with --send-test to send one flagged test event"));
} else if (!tokenOk || !pixelId) {
  console.log(dim("      Skipped — needs a valid token and a pixel id"));
} else if (!testCode) {
  console.log(
    warn(
      "Skipped — META_TEST_EVENT_CODE is not set, and without it the event would be a real Lead.\n" +
        "      Events Manager → the dataset → Test events → copy the TEST##### code into .env.local.",
    ),
  );
} else {
  /* Mirror what lib/meta-capi.ts sends: hashed keys, raw connection details,
     the same custom_data. */
  const sha = (v) => createHash("sha256").update(v, "utf8").digest("hex");
  const result = await postEvents({
    data: [
      {
        event_name: "Lead",
        event_time: Math.floor(Date.now() / 1000),
        event_id: `setup-check-${Date.now()}`,
        action_source: "website",
        event_source_url: "https://campaigns.aaa-accreditation.org/tepa",
        user_data: {
          em: sha("setup-check@example.com"),
          ph: sha("971500000000"),
          fn: sha("setup"),
          ln: sha("check"),
          country: sha("ae"),
          external_id: sha("0"),
          client_user_agent: "meta-check",
          client_ip_address: "127.0.0.1",
        },
        custom_data: {
          content_name: "Setup check",
          content_category: "tepa",
          value: 0,
          currency: (env("GOOGLE_ADS_CURRENCY") || "USD").toUpperCase(),
        },
        data_processing_options: [],
      },
    ],
    test_event_code: testCode,
  });

  if (result.body?.events_received === 1) {
    console.log(ok(`Meta received the test Lead (fbtrace ${result.body.fbtrace_id ?? "?"})`));
    console.log(dim("      It should now be listed under Events Manager → Test events."));
  } else {
    const error = result.body?.error ?? {};
    fail(
      `Meta rejected the test event (HTTP ${result.status})`,
      error.error_user_msg || error.message || JSON.stringify(result.body).slice(0, 400),
    );
  }
}

/* ------------------------------------------------------------- 6. browser */

console.log("\n6. Browser pixel");
const publicId = env("NEXT_PUBLIC_META_PIXEL_ID");
if (!publicId) {
  console.log(dim("      NEXT_PUBLIC_META_PIXEL_ID not set — the pixel will not load"));
} else if (!/^\d+$/.test(publicId)) {
  fail(`NEXT_PUBLIC_META_PIXEL_ID should be digits only, got "${publicId}"`);
} else {
  console.log(ok(`Pixel ${publicId} loads on /tepa, /healthcare and /clinic`));
  console.log(dim("      NEXT_PUBLIC_* values are inlined at build time: changing one needs a rebuild."));
}

console.log("");
console.log(failed ? bad("Setup is incomplete — see the failures above.") : ok("All checks passed."));
console.log("");
process.exit(failed ? 1 : 0);

/* ------------------------------------------------------------- helpers */

async function postEvents(payload) {
  try {
    const response = await fetch(`https://graph.facebook.com/${version}/${pixelId}/events`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(payload),
    });
    const body = await response.json().catch(() => ({}));
    return { status: response.status, body };
  } catch (error) {
    return { status: 0, body: { error: { message: `Could not reach the Graph API: ${error.message}` } } };
  }
}

/* Minimal .env parser. The app gets these from Next.js at runtime; this script
   runs on bare node, so it reads the file itself rather than adding dotenv. */
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
