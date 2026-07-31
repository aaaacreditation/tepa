#!/usr/bin/env node
/* Mints a Google refresh token carrying the Data Manager scope.

   Run once during setup, and again whenever the token stops working:

     npm run ads:auth

   It opens Google's consent screen, catches the redirect on a local port, and
   prints the refresh token to paste into .env.local. The local server is what
   the "authorized redirect URI" in Google Cloud points at; it exists for the
   ~20 seconds of the consent flow and nothing calls it afterwards.

   No webhook is involved anywhere in this integration. Once the token exists,
   the app only ever makes outbound calls to Google. */

import { createServer } from "node:http";
import { spawn } from "node:child_process";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const ROOT = resolve(import.meta.dirname, "..");

/* Must match a redirect URI registered on the OAuth client exactly, character
   for character, because the client is of type "Web application" rather than
   "Desktop app" (which would accept any loopback port).

   This default is a URI already registered on the ClickSalesMedia client, so
   the flow works without touching the Cloud console. Override both if you
   register a different one. */
const PORT = Number(process.env.GOOGLE_OAUTH_PORT || 4400);
const CALLBACK_PATH = process.env.GOOGLE_OAUTH_PATH || "/api/ads/google-oauth/callback";
const REDIRECT_URI = `http://localhost:${PORT}${CALLBACK_PATH}`;

/* Both scopes, because this project needs both and they live in different
   products. datamanager is what the app uses at runtime to upload conversions;
   a token holding only adwords authenticates fine and then 403s on ingest.
   adwords is what `npm run ads:actions` uses to create conversion actions, so
   dropping it would break that script the next time a stage is added.

   Requesting both keeps one token valid for everything. Existing refresh
   tokens on this client are unaffected: Google issues a new one rather than
   revoking what other apps already hold. */
const SCOPE = [
  "https://www.googleapis.com/auth/datamanager",
  "https://www.googleapis.com/auth/adwords",
].join(" ");

loadEnv(".env.local");

const clientId = (process.env.GOOGLE_ADS_CLIENT_ID ?? "").trim();
const clientSecret = (process.env.GOOGLE_ADS_CLIENT_SECRET ?? "").trim();

if (!clientId || !clientSecret) {
  console.error(
    "\nGOOGLE_ADS_CLIENT_ID and GOOGLE_ADS_CLIENT_SECRET must be set in .env.local first.\n\n" +
      "Google Cloud console > APIs & Services > Credentials > Create credentials\n" +
      "  > OAuth client ID > Desktop app\n",
  );
  process.exit(1);
}

/* state ties the redirect back to this run, so a stray request to the loopback
   port cannot feed us someone else's authorization code. */
const state = randomState();

const authUrl =
  "https://accounts.google.com/o/oauth2/v2/auth?" +
  new URLSearchParams({
    client_id: clientId,
    redirect_uri: REDIRECT_URI,
    response_type: "code",
    scope: SCOPE,
    /* offline + consent together are what force Google to return a refresh
       token. Without them a repeat authorization returns only an access
       token, which expires in an hour and is useless to a server. */
    access_type: "offline",
    prompt: "consent",
    state,
  });

console.log("\nGoogle Ads: mint a refresh token");
console.log("=".repeat(34));
console.log(`\nScope:        ${SCOPE}`);
console.log(`Redirect URI: ${REDIRECT_URI}`);
console.log(
  "\nThat redirect URI must be listed on the OAuth client in Google Cloud.\n" +
    "If you see redirect_uri_mismatch, add it there verbatim.\n",
);
console.log("Opening the consent screen. If it does not open, paste this:\n");
console.log(authUrl + "\n");

const code = await waitForCode();
console.log("\nAuthorization code received. Exchanging for a refresh token...");

const response = await fetch("https://oauth2.googleapis.com/token", {
  method: "POST",
  headers: { "Content-Type": "application/x-www-form-urlencoded" },
  body: new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    code,
    grant_type: "authorization_code",
    redirect_uri: REDIRECT_URI,
  }),
});

const body = await response.json().catch(() => ({}));

if (!response.ok || !body.refresh_token) {
  console.error("\nExchange failed:", JSON.stringify(body, null, 2));
  if (body.error === "redirect_uri_mismatch") {
    console.error(
      `\nAdd exactly "${REDIRECT_URI}" to the OAuth client's authorized redirect URIs,\n` +
        "or change the client type to Desktop app.",
    );
  }
  if (!body.refresh_token && body.access_token) {
    console.error(
      "\nGoogle returned an access token but no refresh token. Revoke this app at\n" +
        "https://myaccount.google.com/permissions and run this again.",
    );
  }
  process.exit(1);
}

const granted = String(body.scope ?? "");
console.log("\n" + "=".repeat(60));
console.log("Refresh token (paste into .env.local):\n");
console.log(`GOOGLE_ADS_REFRESH_TOKEN=${body.refresh_token}`);
console.log("\n" + "=".repeat(60));

if (granted.includes("datamanager")) {
  console.log("\nScope check: datamanager granted.");
} else {
  console.log(`\nWARNING: datamanager scope missing. Granted: ${granted || "unknown"}`);
}

console.log("\nNext: npm run ads:check\n");
process.exit(0);

/* ------------------------------------------------------------- helpers */

function waitForCode() {
  return new Promise((resolvePromise, rejectPromise) => {
    const server = createServer((req, res) => {
      const url = new URL(req.url, `http://localhost:${PORT}`);
      /* Favicon and any stray probe must not be mistaken for the callback. */
      if (url.pathname !== CALLBACK_PATH) {
        res.writeHead(404).end();
        return;
      }

      const error = url.searchParams.get("error");
      const code = url.searchParams.get("code");
      const returnedState = url.searchParams.get("state");

      const done = (message) => {
        res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
        res.end(
          `<!doctype html><meta charset="utf-8">` +
            `<body style="font:16px system-ui;padding:3rem;max-width:34rem;margin:auto">` +
            `<h1 style="font-size:1.25rem">${message}</h1>` +
            `<p style="color:#5d6c7b">You can close this tab and return to the terminal.</p>`,
        );
        server.close();
      };

      if (error) {
        done("Authorization denied.");
        rejectPromise(new Error(`Google returned: ${error}`));
        return;
      }
      if (returnedState !== state) {
        done("State mismatch — request ignored.");
        rejectPromise(new Error("State mismatch on the OAuth redirect."));
        return;
      }
      if (!code) {
        done("No authorization code in the redirect.");
        rejectPromise(new Error("No code parameter."));
        return;
      }

      done("Authorized.");
      resolvePromise(code);
    });

    server.on("error", (err) => {
      rejectPromise(
        err.code === "EADDRINUSE"
          ? new Error(
              `Port ${PORT} is already in use, so this script cannot receive the callback.\n\n` +
                `  Find it with:  lsof -i:${PORT}\n\n` +
                "Either stop that process and retry, or use the OAuth Playground instead\n" +
                "(https://developers.google.com/oauthplayground) with these settings:\n" +
                "  gear icon > Use your own OAuth credentials > paste client ID and secret\n" +
                "  scope: https://www.googleapis.com/auth/datamanager\n" +
                "The Playground redirect URI is already registered on this client.",
            )
          : err,
      );
    });

    server.listen(PORT, () => open(authUrl));

    /* Give up rather than hang a terminal forever. */
    setTimeout(
      () => {
        server.close();
        rejectPromise(new Error("Timed out after 5 minutes."));
      },
      5 * 60 * 1000,
    ).unref();
  });
}

function open(url) {
  const cmd =
    process.platform === "darwin" ? "open" : process.platform === "win32" ? "start" : "xdg-open";
  spawn(cmd, [url], { stdio: "ignore", detached: true, shell: process.platform === "win32" })
    .on("error", () => {})
    .unref();
}

function randomState() {
  return Array.from({ length: 24 }, () =>
    "abcdefghijklmnopqrstuvwxyz0123456789"[Math.floor(Math.random() * 36)],
  ).join("");
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
