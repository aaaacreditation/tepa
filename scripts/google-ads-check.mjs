#!/usr/bin/env node
/* Checks the Google Ads conversion tracking setup end to end and says exactly
   which step is broken.

   Run it after filling in .env.local and any time conversions stop arriving:

     npm run ads:check          verify credentials and configuration
     npm run ads:check -- --send-test   also send one validateOnly event

   A validateOnly event is fully parsed and authorised by Google but never
   recorded, so it proves the whole path works without polluting the account. */

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

console.log("\nGoogle Ads conversion tracking check\n" + "=".repeat(38) + "\n");

const env = (key) => (process.env[key] ?? "").trim();
const digits = (value) => value.replace(/\D/g, "");

const clientId = env("GOOGLE_ADS_CLIENT_ID");
const clientSecret = env("GOOGLE_ADS_CLIENT_SECRET");
const refreshToken = env("GOOGLE_ADS_REFRESH_TOKEN");
const customerId = digits(env("GOOGLE_ADS_CUSTOMER_ID"));
const loginCustomerId = digits(env("GOOGLE_ADS_LOGIN_CUSTOMER_ID"));

console.log("1. Credentials");
for (const [key, value] of [
  ["GOOGLE_ADS_CLIENT_ID", clientId],
  ["GOOGLE_ADS_CLIENT_SECRET", clientSecret],
  ["GOOGLE_ADS_REFRESH_TOKEN", refreshToken],
  ["GOOGLE_ADS_CUSTOMER_ID", customerId],
]) {
  if (value) console.log(ok(`${key} is set`));
  else fail(`${key} is missing`, "Add it to .env.local");
}
if (loginCustomerId) console.log(ok(`GOOGLE_ADS_LOGIN_CUSTOMER_ID = ${loginCustomerId}`));
else console.log(dim("      GOOGLE_ADS_LOGIN_CUSTOMER_ID not set (fine unless access is via an MCC)"));

/* ------------------------------------------------------------- 2. stages */

console.log("\n2. Conversion actions");
const STAGES = ["lead", "mql", "sql", "customer"];
const DEFAULT_VALUE = { lead: 0, mql: 50, sql: 250, customer: 2000 };
const configured = [];

for (const stage of STAGES) {
  const action = env(`GOOGLE_ADS_ACTION_${stage.toUpperCase()}`);
  const rawValue = env(`GOOGLE_ADS_VALUE_${stage.toUpperCase()}`);
  const value = rawValue === "" ? DEFAULT_VALUE[stage] : Number(rawValue);

  if (!action) {
    console.log(dim(`      ${stage.padEnd(9)} not configured — this stage will not be reported`));
    continue;
  }
  if (!/^\d+$/.test(action)) {
    fail(
      `GOOGLE_ADS_ACTION_${stage.toUpperCase()} should be the numeric conversion action ID, got "${action}"`,
      "Google Ads > Goals > Conversions > the action > the ctId number in the page URL",
    );
    continue;
  }
  console.log(ok(`${stage.padEnd(9)} action ${action}, value ${value}`));
  configured.push({ stage, action, value });
}

if (configured.length === 0) {
  console.log(
    warn("No stage has a conversion action, so nothing will ever be sent to Google Ads."),
  );
}

/* -------------------------------------------------------------- 3. oauth */

console.log("\n3. OAuth");
let accessToken = "";

if (!clientId || !clientSecret || !refreshToken) {
  console.log(dim("      Skipped — credentials incomplete"));
} else {
  try {
    const response = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
        grant_type: "refresh_token",
      }),
    });
    const body = await response.json().catch(() => ({}));

    if (response.ok && body.access_token) {
      accessToken = body.access_token;
      console.log(ok("Refresh token exchanged for an access token"));

      /* The Data Manager API authorises against its own scope. A token minted
         for the Google Ads scope alone reaches this point and then 403s. */
      const scopes = String(body.scope ?? "");
      if (scopes.includes("datamanager")) {
        console.log(ok("Token carries the datamanager scope"));
      } else {
        fail(
          `Token is missing the datamanager scope (has: ${scopes || "unknown"})`,
          "Re-mint the refresh token with https://www.googleapis.com/auth/datamanager",
        );
      }

      /* adwords is only needed by ads:actions, so a token without it still
         uploads conversions fine. Worth saying out loud rather than letting it
         surface later as a confusing failure when a stage is added. */
      if (!scopes.includes("adwords")) {
        console.log(
          warn("Token lacks the adwords scope — `npm run ads:actions` will fail (uploads are fine)"),
        );
      }

      /* The expiry that catches people out. Google only returns
         refresh_token_expires_in when the OAuth consent screen is still in
         Testing, where refresh tokens die after 7 days. A campaign wired up on
         such a token stops reporting a week later with no obvious cause. */
      const expiresIn = Number(body.refresh_token_expires_in);
      if (Number.isFinite(expiresIn) && expiresIn > 0) {
        const days = Math.floor(expiresIn / 86400);
        const when = new Date(Date.now() + expiresIn * 1000).toISOString().slice(0, 10);
        fail(
          `Refresh token EXPIRES in ${days} day(s), on ${when}`,
          "The OAuth consent screen is still in Testing. Publish it\n" +
            "      (Google Auth Platform > Audience > Publish), then re-mint:\n" +
            "        npm run ads:auth\n" +
            "      Conversions stop reaching Google once it lapses.",
        );
      } else {
        console.log(ok("Refresh token has no expiry (consent screen is published)"));
      }
    } else {
      const detail = body.error_description || body.error || `HTTP ${response.status}`;
      fail(`Token refresh rejected: ${detail}`, oauthHint(body.error));
    }
  } catch (error) {
    fail(`Could not reach Google OAuth: ${error.message}`);
  }
}

/* --------------------------------------------------------- 4. test event */

console.log("\n4. Test event");
if (!SEND_TEST) {
  console.log(dim("      Skipped — re-run with --send-test to try a validateOnly ingest"));
} else if (!accessToken || !customerId || configured.length === 0) {
  console.log(dim("      Skipped — needs a working token, a customer ID, and one stage configured"));
} else {
  const target = configured[0];
  const account = { accountType: "GOOGLE_ADS", accountId: customerId };
  const payload = {
    destinations: [
      {
        operatingAccount: account,
        loginAccount: loginCustomerId
          ? { accountType: "GOOGLE_ADS", accountId: loginCustomerId }
          : account,
        productDestinationId: target.action,
      },
    ],
    encoding: "HEX",
    events: [
      {
        transactionId: "setup-check-0",
        eventTimestamp: new Date().toISOString(),
        eventSource: "WEB",
        /* Mirror what lib/google-data-manager.ts actually sends, click id and
           all, so this proves the production payload shape rather than a
           simplified one that happens to validate. */
        adIdentifiers: { gclid: "SETUP_CHECK_NOT_A_REAL_CLICK" },
        userData: {
          userIdentifiers: [
            {
              emailAddress: createHash("sha256")
                .update("setup-check@example.com", "utf8")
                .digest("hex"),
            },
          ],
        },
        conversionValue: 0,
        currency: (env("GOOGLE_ADS_CURRENCY") || "USD").toUpperCase(),
      },
    ],
    consent: { adUserData: "CONSENT_GRANTED", adPersonalization: "CONSENT_GRANTED" },
    /* Nothing is recorded. Google parses and authorises, then discards. */
    validateOnly: true,
  };

  try {
    const response = await fetch("https://datamanager.googleapis.com/v1/events:ingest", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    const text = await response.text();

    if (response.ok) {
      console.log(ok(`Data Manager accepted a validateOnly event for stage "${target.stage}"`));
      if (text.trim() && text.trim() !== "{}") console.log(dim(`      ${text.slice(0, 400)}`));
    } else {
      fail(`Data Manager rejected the event (HTTP ${response.status})`, text.slice(0, 500));
      if (response.status === 403) {
        console.log(
          dim("      403 usually means the account is not linked to the Cloud project,"),
        );
        console.log(dim("      or the Data Manager API is not enabled on that project."));
      }
    }
  } catch (error) {
    fail(`Could not reach the Data Manager API: ${error.message}`);
  }
}

/* ------------------------------------------------------------- 5. client */

console.log("\n5. Browser tag (optional)");
const gtagId = env("NEXT_PUBLIC_GOOGLE_ADS_ID");
if (!gtagId) {
  console.log(dim("      NEXT_PUBLIC_GOOGLE_ADS_ID not set — gtag.js will not load"));
} else if (!/^AW-\d+$/.test(gtagId)) {
  fail(`NEXT_PUBLIC_GOOGLE_ADS_ID should look like AW-123456789, got "${gtagId}"`);
} else {
  console.log(ok(`gtag will load with ${gtagId}`));
  const formLabel = env("NEXT_PUBLIC_GOOGLE_ADS_LABEL_FORM");
  const calLabel = env("NEXT_PUBLIC_GOOGLE_ADS_LABEL_CALENDLY");
  console.log(
    formLabel
      ? ok("Form submit conversion label set")
      : dim("      No form submit label — browser side form conversion is off"),
  );
  console.log(
    calLabel
      ? ok("Calendly click conversion label set")
      : dim("      No Calendly label — booking clicks are not counted"),
  );

  /* Double counting is the quiet failure here: both paths would report the
     same form submit against the same conversion action. */
  if (formLabel && env("GOOGLE_ADS_ACTION_LEAD")) {
    console.log(
      warn(
        "Both NEXT_PUBLIC_GOOGLE_ADS_LABEL_FORM and GOOGLE_ADS_ACTION_LEAD are set.\n" +
          "      If they point at the same conversion action, every enquiry counts twice.\n" +
          "      Pick one: the browser tag, or the server side upload.",
      ),
    );
  }
}

console.log("");
console.log(failed ? bad("Setup is incomplete — see the failures above.") : ok("All checks passed."));
console.log("");
process.exit(failed ? 1 : 0);

/* ------------------------------------------------------------- helpers */

function oauthHint(error) {
  if (error !== "invalid_grant") return "";
  return [
    "invalid_grant means the refresh token is not usable. Most common causes:",
    "  - it was minted with a different client ID/secret than the ones above",
    "  - the OAuth consent screen is still in Testing, where refresh tokens die after 7 days",
    "  - it was revoked, or the Google account password changed",
    "Fix: publish the consent screen, then mint a fresh refresh token for this exact client.",
  ].join("\n      ");
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
