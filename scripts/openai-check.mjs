#!/usr/bin/env node
/* Checks the ChatGPT ads (OpenAI Ads) pixel and Conversions API setup and
   says which step is broken.

     npm run openai:check

   Both events the landing pages send, lead_created and contents_viewed, are
   posted with validate_only, so OpenAI checks the key and the payload in full
   and then discards them. Nothing is recorded against the pixel. */

import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const ROOT = resolve(import.meta.dirname, "..");
loadEnv(".env.local");

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

const env = (key) => (process.env[key] ?? "").trim();
const pixelId = env("OPENAI_PIXEL_ID") || env("NEXT_PUBLIC_OPENAI_PIXEL_ID");
const apiKey = env("OPENAI_ADS_API_KEY");
const siteUrl = (env("NEXT_PUBLIC_SITE_URL") || "https://campaigns.aaa-accreditation.org").replace(/\/$/, "");

console.log("\nChatGPT ads pixel + Conversions API check\n" + "=".repeat(41) + "\n");

console.log("1. Configuration");
if (pixelId) console.log(ok(`Pixel ${pixelId}`));
else fail("NEXT_PUBLIC_OPENAI_PIXEL_ID is missing", "Ads Manager → Conversions → the pixel id");
if (apiKey) console.log(ok("OPENAI_ADS_API_KEY is set"));
else fail("OPENAI_ADS_API_KEY is missing", "Ads Manager → Conversions → Conversions API key");
if (env("NEXT_PUBLIC_OPENAI_PIXEL_DEBUG") === "true")
  console.log(warn("NEXT_PUBLIC_OPENAI_PIXEL_DEBUG=true: the pixel logs to the console. Leave it off in production."));
if (env("OPENAI_ADS_VALIDATE_ONLY") === "true")
  console.log(warn("OPENAI_ADS_VALIDATE_ONLY=true: every server event is discarded. Leave it unset in production."));

if (failed) finish();

console.log("\n2. Conversions API (validate_only)");
const sha = (v) => createHash("sha256").update(v, "utf8").digest("hex");
const now = Date.now();
const events = [
  {
    id: `check-lead-${now}`,
    type: "lead_created",
    timestamp_ms: now,
    action_source: "web",
    source_url: `${siteUrl}/tepa`,
    user: {
      emails_sha256: [sha("check@example.com")],
      countries: ["AE"],
      ip_address: "203.0.113.10",
      user_agent: "openai-check",
    },
    data: { type: "customer_action" },
  },
  {
    id: `check-view-${now}`,
    type: "contents_viewed",
    timestamp_ms: now,
    action_source: "web",
    source_url: `${siteUrl}/tepa`,
    data: {
      type: "contents",
      contents: [{ id: "tepa", name: "Training & Education Provider Accreditation", content_type: "page" }],
    },
  },
];

for (const event of events) {
  try {
    const response = await fetch(`https://bzr.openai.com/v1/events?pid=${encodeURIComponent(pixelId)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({ validate_only: true, integration_source: "aaa-landing-pages", events: [event] }),
    });
    const text = await response.text();
    if (response.ok) console.log(ok(`${event.type} accepted ${dim(text.trim())}`));
    else if (response.status === 401)
      fail(`${event.type}: HTTP 401, the key was rejected`, "Check OPENAI_ADS_API_KEY, or that it belongs to this pixel's ad account");
    else fail(`${event.type}: HTTP ${response.status}`, text.replace(/\s+/g, " ").slice(0, 400));
  } catch (error) {
    fail(`${event.type}: request failed`, String(error));
  }
}

finish();

function finish() {
  console.log(failed ? `\n${bad("Something needs fixing.")}\n` : `\n${ok("All good.")}\n`);
  process.exit(failed ? 1 : 0);
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
