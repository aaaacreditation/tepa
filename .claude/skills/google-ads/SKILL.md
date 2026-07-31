---
name: google-ads
description: Review and control the Google Ads conversion tracking for the TEPA landing page. Use when the user asks to check Google Ads, review conversion tracking, see whether conversions are reaching Google, fix or re-mint an expired token, change which pipeline stage is the primary bidding goal (lead/MQL/SQL/customer), retry failed conversion uploads, or diagnose why conversions are missing.
---

# Google Ads conversion tracking — review and control

This project reports the TEPA lead pipeline to Google Ads as offline
conversions. Read `docs/google-ads-conversions.md` for how it works; this skill
is the operational runbook.

**Two facts that are easy to get wrong:**

- Uploads go through the **Data Manager API**, not the Google Ads API.
  `ConversionUploadService` closed to new integrations on 15 June 2026 and this
  account returns `CUSTOMER_NOT_ALLOWLISTED_FOR_THIS_FEATURE` on it. Never
  reintroduce it.
- The account type enum is `GOOGLE_ADS`. Google's own docs say
  `GOOGLE_ADS_ACCOUNT`; that value is rejected.

## Account

| | |
| --- | --- |
| Operating account | `6578203282` — American Accreditation Association (USD) |
| Manager (MCC) | `3446752292` — Clicksalesmedia LLC |
| Conversion ID | `AW-10792220218` |

Conversion actions live in the operating account, not the MCC. In the Google Ads
UI you must switch into *American Accreditation Association* to see them, then
**Goals → Conversions → Summary**.

## Step 1 — always start here

```bash
npm run ads:check              # config, credentials, token expiry
npm run ads:check -- --send-test   # plus a real validateOnly ingest
```

`--send-test` is fully authorised by Google and then discarded, so it proves the
whole path without recording anything. Run it whenever the user asks whether
tracking "is working".

Then show the pipeline goal state:

```bash
npm run ads:actions            # read only; lists actions and which is PRIMARY
```

Report what each check says in plain language. Do not claim tracking works
unless the test event actually returned PASS.

## Step 2 — interpret the result

| Symptom | Meaning | Fix |
| --- | --- | --- |
| `Refresh token EXPIRES in N days` | Consent screen still in *Testing*, tokens die after 7 days | Publish the consent screen, then re-mint (below) |
| `Token refresh rejected: invalid_grant` | Token revoked, expired, or minted for a different client | Re-mint (below) |
| `missing the datamanager scope` | Token was minted for `adwords` only | Re-mint with **both** scopes |
| `lacks the adwords scope` | Uploads fine, but `ads:actions` will fail | Re-mint with both scopes |
| `403 ACCESS_TOKEN_SCOPE_INSUFFICIENT` | Same as above | Re-mint with both scopes |
| `400 ... Resource not found` | A newly created conversion action has not propagated to Data Manager yet | Wait. It self-heals; the outbox retries |
| `no gclid and no hashable email` | Lead did not come from a tracked click | Expected for direct traffic. Not a bug |
| `stage not configured` | That stage has no `GOOGLE_ADS_ACTION_*` id | Only a problem if the user wanted it reported |

## Step 3 — re-minting the token

Needed roughly every time the user says conversions stopped.

Tell the user to publish the consent screen **first**, or the new token expires in
7 days too: Google Auth Platform → Audience → **Publish app**.

Then:

```bash
npm run ads:auth
```

It opens Google's consent screen and prints a `GOOGLE_ADS_REFRESH_TOKEN=` line
to paste into `.env.local`.

**If it fails with `EADDRINUSE`**, another app owns the port — the user's
ClickSalesMedia project runs on 4400. Do not kill it. Use the OAuth Playground
instead, which is already a registered redirect URI on this client:

1. <https://developers.google.com/oauthplayground>
2. Gear icon → tick **Use your own OAuth credentials** → paste
   `GOOGLE_ADS_CLIENT_ID` and `GOOGLE_ADS_CLIENT_SECRET` from `.env.local`
3. Bottom left, **Input your own scopes**, paste **both**:
   `https://www.googleapis.com/auth/datamanager https://www.googleapis.com/auth/adwords`
4. **Authorize APIs** → allow → **Exchange authorization code for tokens**
5. Copy the `refresh_token` into `.env.local`

Warn the user never to click **Revoke access** in the Playground — it kills every
token for this OAuth client, including their ClickSalesMedia app.

After updating `.env.local`, re-run `npm run ads:check` to confirm, and remind
the user to update `GOOGLE_ADS_REFRESH_TOKEN` in **Vercel** too. A token fixed
locally changes nothing in production.

## Step 4 — changing which stage is the primary goal

Smart Bidding optimises against **primary** goals only. Secondary goals are
recorded and reported but do not steer bidding.

The strategy is a ladder: start on the stage with enough volume for the
algorithm to learn, and climb as each later stage earns the volume to sustain
bidding on its own.

```bash
npm run ads:actions -- --primary=mql             # preview, changes nothing
npm run ads:actions -- --primary=mql --create    # apply
```

Valid stages: `lead`, `mql`, `sql`, `customer`. The named stage becomes PRIMARY
and every other stage is demoted to secondary in the same pass.

**Always run the preview first and show the user the diff before applying.**
This changes bidding on a live account.

**Advise on timing, do not just execute:**

- Promote a stage only when it produces roughly **30 conversions a month**.
  Below about 15, Smart Bidding starves and performance degrades.
- Every switch costs **one to two weeks** of unstable performance while bidding
  relearns. Do not change goals more often than that, and tell the user not to
  panic during the window.
- **Customer may never be the right end state.** For a high ticket service,
  30 customers a month is unrealistic and `sql` is a perfectly good resting
  place — far closer to revenue than a raw form fill.

Every stage keeps uploading regardless of which is primary, so the history is
already there when the next stage is promoted. There is no cold start.

## Step 5 — conversions not arriving

Failed uploads are visible per lead in the dashboard, in the lead detail panel
under **Google Ads conversions**. Check the outbox directly with:

```sql
SELECT stage, status, attempts, left(last_error, 120) AS error, created_at
FROM conversion_uploads ORDER BY created_at DESC LIMIT 20;
```

Status meanings: `pending` waiting or retrying, `sending` claimed by a sender in
flight, `sent` accepted by Google, `failed` gave up after 5 attempts,
`skipped` deliberately not sent (demo lead, unconfigured stage, or a lead with
no click id and no hashable email).

Force a retry:

```bash
curl -X POST https://<host>/api/conversions/process \
  -H "Authorization: Bearer $CONVERSIONS_CRON_SECRET"
```

`GOOGLE_ADS_VALIDATE_ONLY=true` makes the sender dry run — Google authorises and
discards. Useful for testing a credential change against production without
recording fake conversions. Never leave it set in production.

## Guardrails

- **Never set both `GOOGLE_ADS_ACTION_LEAD` and
  `NEXT_PUBLIC_GOOGLE_ADS_LABEL_FORM`.** They are two routes to the same event
  and would count every enquiry twice. The form is currently reported
  server-side; `LABEL_FORM` is intentionally blank.
- `GOOGLE_ADS_DEVELOPER_TOKEN` is used only by `ads:actions` locally. It is not
  needed in Vercel and the app never reads it.
- Creating or repointing conversion actions writes to a live ad account.
  Preview first, and confirm with the user before `--create`.
- `ads:actions` matches by name, so re-running never creates duplicates.
