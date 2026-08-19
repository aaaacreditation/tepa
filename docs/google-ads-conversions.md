# Google Ads conversion tracking

Reports the TEPA funnel back to Google Ads: the enquiry when it arrives, and
each pipeline stage as someone moves a lead through the dashboard.

Run `npm run ads:check` at any point. It verifies each step below and names the
one that is broken.

---

## Read this first: the API changed in June 2026

Offline conversion imports used to go through the Google Ads API
(`ConversionUploadService.UploadClickConversions`). That path is closed to new
integrations:

> Starting June 15, 2026, UploadClickConversion requests will fail if the
> developer token hasn't previously sent requests to upload offline conversions
> or enhanced conversions for leads. Use the Data Manager API instead.
> — [Google, Manage offline conversions](https://developers.google.com/google-ads/api/docs/conversions/upload-offline)

This project had no tracking before now, so it is a new integration and uses the
[Data Manager API](https://developers.google.com/data-manager/api) instead.

Two consequences that trip people up:

- **The developer token is not used.** Data Manager authorises on OAuth and
  account linkage alone. Any Google Ads developer token you were given is not
  needed here.
- **A different OAuth scope is required.** Data Manager needs
  `https://www.googleapis.com/auth/datamanager`. A refresh token minted only for
  `https://www.googleapis.com/auth/adwords` authenticates fine and then fails
  with 403 on ingest.

---

## How it fits together

| What happens | Where it is tracked | Why |
| --- | --- | --- |
| Visitor arrives from an ad | `AttributionCapture` writes the click ID to a cookie | Nothing else works without this |
| Visitor submits the enquiry form | gtag in the browser, or a server upload | Both work; pick one |
| Visitor clicks a Calendly link | gtag in the browser | Happens before any form fill |
| Lead moved to MQL / SQL / Customer | Server upload to Data Manager | Happens days later, with no browser present |

This is shared by every landing page. `/tepa` and `/healthcare` each mount
`AttributionCapture` and `GoogleTag` from `app/(frontend)/components`, post to
their own enquiry route, and write a lead tagged with their source key. What
differs per page is only which conversion actions the stages report into.

The pipeline stages are the reason this exists. A form fill is a weak signal —
some enquiries are students, some are competitors. Telling Google which ones
became customers, and what each stage is worth, is what lets Smart Bidding
optimise for revenue instead of form fills.

### The click ID is the linchpin

Google matches an offline conversion back to the ad click through the `gclid`
in the landing page URL. If it is not captured at form-fill time, nothing later
can recover it.

`AttributionCapture` stores it in a first-party cookie for 90 days, matching
Google's default click lookback. That survives the visitor reading the page,
booking a Calendly call, and coming back an hour later.

Leads that arrive without a click ID still upload, matched on the SHA-256 hashed
email instead (enhanced conversions for leads). The match rate is lower, but it
is the difference between partial credit and none.

### Failures are visible, not silent

A status change writes a row to the `conversion_uploads` outbox in the same
transaction that moves the lead, then a sender drains it after the response.
Uploading inline would mean a Google outage either blocks the dashboard or
loses the conversion.

Each lead's detail panel shows every stage upload and its state. A failed
credential shows up as a red **Failed** badge with the error, not as
conversions quietly missing from the ad account weeks later.

`dedupe_key` is `leadId:stage`, so demoting a lead and re-promoting it cannot
double count.

---

## Setup

### 1. Google Cloud project

1. Enable the **Data Manager API** on the project.
2. OAuth consent screen → **Publish** it. While it is in *Testing*, refresh
   tokens expire after 7 days and you will see `invalid_grant`.
3. Create an **OAuth client ID** of type *Desktop app*.
4. Mint a refresh token with the scope
   `https://www.googleapis.com/auth/datamanager`.

### 2. Conversion actions in Google Ads

Create one conversion action per stage you want to report, under
**Goals → Conversions → New conversion action → Import → Manual import**, or
let the script do it:

```bash
npm run ads:actions                                  # TEPA, show what is missing
npm run ads:actions -- --create                      # TEPA, create them
npm run ads:actions -- --source=healthcare --create  # the healthcare page
```

Suggested setup:

| Stage | TEPA action | Healthcare action | Count | Value |
| --- | --- | --- | --- | --- |
| Lead | TEPA Enquiry | Healthcare Enquiry | One | 0 (or your cost per lead) |
| MQL | TEPA MQL | Healthcare MQL | One | 50 |
| SQL | TEPA SQL | Healthcare SQL | One | 250 |
| Customer | TEPA Customer | Healthcare Customer | One | 2000 |

Set **Count: One** on all of them — one organization accrediting is one
conversion, not one per program.

#### One set of actions per landing page

Each landing page in `lib/sources.ts` reports into its own actions, named with
the suffixed environment variables below. A campaign then bids on the funnel it
actually paid for. Point two landing pages at one action and Smart Bidding
cannot tell them apart: the healthcare campaign optimises partly against TEPA's
leads and vice versa. `npm run ads:check` warns when that is the case.

Only the *Customer* action normally belongs in the **Primary** conversion goal
used for bidding. Keep the rest as **Secondary** so they are observed but do not
distort optimisation.

To find an action's numeric ID: open it in Google Ads and read `ctId=` from the
page URL.

### 3. Environment

Add to `.env.local` (already gitignored):

```bash
# --- Server side upload (Data Manager API) ---
GOOGLE_ADS_CLIENT_ID=...apps.googleusercontent.com
GOOGLE_ADS_CLIENT_SECRET=GOCSPX-...
GOOGLE_ADS_REFRESH_TOKEN=1//...        # must carry the datamanager scope
GOOGLE_ADS_CUSTOMER_ID=1234567890      # the Google Ads account, digits only
GOOGLE_ADS_LOGIN_CUSTOMER_ID=          # only if access is via an MCC

# Conversion action IDs. A stage with no ID is simply not reported.
GOOGLE_ADS_ACTION_LEAD=                # leave blank if gtag counts the form
GOOGLE_ADS_ACTION_MQL=987654321
GOOGLE_ADS_ACTION_SQL=987654322
GOOGLE_ADS_ACTION_CUSTOMER=987654323

# Per landing page. A suffixed variable wins over the shared one above; with
# none set the page falls back to the shared action. The suffix is the source
# key from lib/sources.ts, uppercased.
GOOGLE_ADS_ACTION_LEAD_HEALTHCARE=
GOOGLE_ADS_ACTION_MQL_HEALTHCARE=987654331
GOOGLE_ADS_ACTION_SQL_HEALTHCARE=987654332
GOOGLE_ADS_ACTION_CUSTOMER_HEALTHCARE=987654333

# Value per stage. Defaults: 0 / 50 / 250 / 2000. Also accepts the suffix, so a
# healthcare customer can be worth more than a training one.
GOOGLE_ADS_VALUE_MQL=50
GOOGLE_ADS_VALUE_SQL=250
GOOGLE_ADS_VALUE_CUSTOMER=2000
GOOGLE_ADS_CURRENCY=USD

# Lets a scheduler retry failed uploads. Unset = endpoint disabled.
CONVERSIONS_CRON_SECRET=<random string>

# --- Browser side tag (optional) ---
NEXT_PUBLIC_GOOGLE_ADS_ID=AW-123456789
NEXT_PUBLIC_GOOGLE_ADS_LABEL_FORM=AbC-D_efGh            # /tepa
NEXT_PUBLIC_GOOGLE_ADS_LABEL_FORM_HEALTHCARE=IjK-L_mnOp # /healthcare
NEXT_PUBLIC_GOOGLE_ADS_LABEL_CALENDLY=XyZ-1_23456       # /tepa only
```

> **Do not set both `NEXT_PUBLIC_GOOGLE_ADS_LABEL_FORM` and
> `GOOGLE_ADS_ACTION_LEAD` against the same conversion action.** They are two
> routes to the same event and would count every enquiry twice. `ads:check`
> warns when it sees both.
>
> The browser tag is simpler; the server upload survives ad blockers. Prefer the
> server upload if you have to choose.

### 4. Verify

```bash
npm run ads:check              # config and credentials
npm run ads:check -- --send-test   # plus a validateOnly ingest
```

`--send-test` sends a real, fully authorised request that Google parses and then
discards. Nothing is recorded in the account.

---

## Operating it

### Retrying failures

The outbox retries automatically on the next status change or enquiry. To flush
it on demand:

```bash
curl -X POST https://<host>/api/conversions/process \
  -H "Authorization: Bearer $CONVERSIONS_CRON_SECRET"
```

Worth running on a schedule (every 15 minutes) so a transient Google outage
heals without anyone noticing. A row is retried up to 5 times before it is
marked `failed`.

Permanently unmatched conversions — no click ID and no hashable email — are
marked `skipped` rather than retried forever.

### Demo leads

Rows seeded by `npm run demo:seed` carry `is_demo` and are always skipped.
Reporting them would train Smart Bidding on fiction.

### Backfilled stages

Dragging a lead straight from Lead to Customer queues MQL and SQL too. The lead
did pass through those stages in business terms, and Google needs each milestone
to learn the funnel shape. This also keeps the uploads consistent with the
dashboard's own "reached" counts.

---

## Troubleshooting

| Symptom | Cause |
| --- | --- |
| `invalid_grant` on refresh | Consent screen still in *Testing* (tokens die after 7 days), token minted for a different client, or it was revoked |
| 403 on ingest | Token lacks the `datamanager` scope, the Data Manager API is not enabled, or the Ads account is not linked to the Cloud project |
| `CUSTOMER_NOT_ALLOWLISTED_FOR_THIS_FEATURE` | You are on the old Google Ads API path. This project does not use it |
| Uploads say "no gclid and no hashable email" | Lead did not come from a tracked click and left no usable email. Expected for direct traffic |
| Conversions counted twice | Both the gtag label and the server action are set for the same event |
| Everything says "Not sent" | No conversion action IDs configured — see step 2 |
