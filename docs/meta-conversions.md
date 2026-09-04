# Meta pixel and Conversions API

Reports each landing page's funnel to Meta: the visit, real engagement, the
enquiry when it arrives, and each pipeline stage as someone moves a lead
through the dashboard. It runs beside the Google Ads reporting described in
`docs/google-ads-conversions.md` and shares its attribution cookie, its outbox
and its dashboard panel.

Run `npm run meta:check` at any point. It verifies each step below and names
the one that is broken.

---

## The dataset

| | |
| --- | --- |
| Dataset (pixel) | **AAA - Landing Pages** — `1104633055225029` |
| Business portfolio | American Accreditation Association - AAA — `1430378177170499` |
| Ad account | `594547015783583` |
| Graph API version | `v26.0` (`META_GRAPH_VERSION`) |

One dataset serves `/tepa`, `/healthcare` and `/clinic`. Meta tells the pages
apart by the page URL and by the `content_category` every event carries
(`tepa`, `healthcare`, `clinic`), through custom conversions built in Events
Manager. There is nothing to configure per page, which is the opposite of the
Google setup and deliberate: Meta's campaigns choose what to optimise for from
custom conversions, so page separation lives there rather than in the code.

---

## How it fits together

| What happens | Browser (pixel) | Server (Conversions API) |
| --- | --- | --- |
| Visitor arrives | `PageView` | — |
| Scrolls past half the page, or stays 15 s | `ViewContent` | — |
| Submits the enquiry form | `Lead`, event id *X*, advanced matching | `Lead`, event id *X*, hashed contact details, IP, user agent, `_fbp` / `_fbc` |
| Clicks a Calendly link (`/tepa`) | `Schedule` | — |
| Lead moved to MQL / SQL / Customer in the dashboard | — | `MQL` / `SQL` / `Purchase` |
| Lead marked Not qualified in the dashboard | — | Nothing; a rejection is not a conversion |

`MetaPixel` and `MetaViewContent` are mounted from each landing page's
layout in `app/(frontend)`, next to the Google tag. The enquiry forms fire the
browser `Lead`; the enquiry routes queue the server `Lead`; the dashboard's
status action queues the later stages. `lib/meta-capi.ts` does the sending.

### Why the enquiry is sent twice

The pixel is fast but lossy: ad blockers, Safari's tracking prevention and
iOS opt-outs drop a large share of it. The server call always lands, and it
is the only one that can carry hashed contact details for matching. Sending
both with one `event_id` gives the coverage of the server with the timing of
the browser, counted once.

The form mints the id with `crypto.randomUUID()` before it posts, sends it in
the request body, and fires `fbq('track', 'Lead', …, { eventID })` with it
once the server has confirmed the lead was stored. The route stores the same
id on the outbox row and the server event goes out with it. Meta collapses
two events with the same name and id received within 48 hours into one.

If Events Manager → Test events shows the browser and server `Lead` as **two
separate rows** rather than one marked *Deduplicated*, the ids are not
matching. Check nothing else on the page calls `fbq('track', 'Lead')`.

### What the server sends

Every value Meta matches on is normalised and SHA-256 hashed before it leaves
the server; raw contact details never reach Meta. The rules are in
`lib/meta-identity.ts` and they matter: Meta hashes its own side the same way,
and a value normalised differently produces a valid-looking digest that
matches nobody.

| Key | From | Rule |
| --- | --- | --- |
| `em` | email | trimmed, lowercase |
| `ph` | phone | digits only, country code first, no leading zeros. Kept only when the visitor clearly typed a country code (`+`, `00`, or 11+ digits) |
| `fn` / `ln` | full name | first word / the rest, lowercase, letters only |
| `country` | country select | ISO alpha-2, lowercase |
| `external_id` | lead id | hashed |
| `client_ip_address`, `client_user_agent` | the enquiry request | raw, enquiry only |
| `fbp`, `fbc` | the pixel's cookies | raw |

### The click id, and why it is stored twice

Meta's ad click arrives as `fbclid` in the landing URL. The pixel turns it
into an `_fbc` cookie and writes an `_fbp` browser id; both are read back
from the Cookie header when the enquiry is posted and stored on the lead.

`AttributionCapture` also keeps `fbclid` in the `aaa_attr` cookie beside
Google's click ids. Safari expires JavaScript-written cookies after seven
days, `_fbc` included, so when the enquiry arrives without one the server
rebuilds it from the stored `fbclid` in the shape Meta documents
(`fb.1.<time>.<fbclid>`). A Meta click never overwrites a Google click in the
cookie, or the other way round: each platform attributes on its own last
click inside its own window, so both are kept until a newer click from the
same platform replaces them (`mergeAttribution` in `lib/attribution.ts`).

### Pipeline stages

This is the answer to "can we push MQL and SQL to Meta the way we do to Google
Ads": yes. Meta retired its separate Offline Conversions API in favour of the
Conversions API, and a stage change is sent through the same endpoint as the
enquiry, with the differences below.

| | Enquiry (`lead`) | Later stages (`mql`, `sql`, `customer`) |
| --- | --- | --- |
| Event name | `Lead` | `MQL`, `SQL`, `Purchase` (custom, custom, standard) |
| `action_source` | `website` | `system_generated` — Meta's source for events a CRM reports |
| `event_id` | the pixel's id | `meta:<leadId>:<stage>` |
| Matched on | contact details, IP, user agent, `_fbp`, `_fbc` | contact details, `_fbp`, `_fbc` saved at enquiry time |
| `custom_data` | `content_name`, `content_category`, `value`, `currency` | the same, plus `event_source: "crm"` and `lead_event_source: "AAA Leads Dashboard"`, Meta's convention for CRM stage events |

Stage values are the same numbers Google receives (`GOOGLE_ADS_VALUE_*`,
including the per-page ones): a value says what a stage is worth to the
business, not to a platform. `Purchase` carries the customer value so Meta's
value optimisation and ROAS columns work on it.

Compared with Google there is no click id to upload — Meta matches on the
hashed identity plus the browser ids — and Meta only accepts events dated
within the last 7 days, so a row that fails for a week is settled as skipped
rather than retried forever.

Dragging a lead straight to Customer backfills MQL and SQL, exactly as for
Google, so Meta sees the whole funnel. Marking a lead not qualified sends
nothing at all — see the same section in the Google document.

### Failures are visible, not silent

Each stage writes one outbox row per platform (`conversion_uploads.destination`
is `google` or `meta`) in the same request that moved the lead, and the
sender drains both after the response. A Meta outage cannot hold up Google's
upload and vice versa. Every row shows in the lead's detail panel under
**Ad platform conversions** with its state and, if it failed, the reason.

---

## Setup

### 1. Access token

Events Manager → **AAA - Landing Pages** → **Settings** → **Conversions API**
→ *Set up direct integration* → **Generate access token**. It is a system-user
token with no expiry. Treat it like a database password: never commit it,
never prefix it `NEXT_PUBLIC_`.

Leave the *Conversions API · Web-only · Connection pending* card on that
screen alone. It is Meta's own browser-to-server relay; this integration
replaces it, and running both would double count because the relay gives no
`event_id` to deduplicate on.

### 2. Environment

Add to `.env.local` (already gitignored):

```bash
NEXT_PUBLIC_META_PIXEL_ID=1104633055225029   # inlined at build time
META_CAPI_ACCESS_TOKEN=EAAX...               # from step 1
META_GRAPH_VERSION=v26.0
META_TEST_EVENT_CODE=                        # testing only, see step 3

# Optional. Unset = Lead / MQL / SQL / Purchase; "off" silences a stage.
#META_EVENT_MQL=MQL
#META_EVENT_SQL=SQL
#META_EVENT_CUSTOMER=Purchase
```

Production reads the same variables from `/opt/tepa/app/.env` on the server
(see the `aaa_lp_deployement` skill). `META_*` values are read at runtime, so
after editing that file a `systemctl restart tepa.service` is enough; the
`NEXT_PUBLIC_` pixel id needs a rebuild, which a normal deploy does.

### 3. Verify before spending

```bash
npm run meta:check                 # token, dataset access, event names
npm run meta:check -- --send-test  # plus one Lead flagged as a test event
```

The write-access check posts an event dated nine days back. Meta authorises
it and then refuses it for its age, which proves the token can post to this
dataset without recording anything. `--send-test` needs a test code:

1. Events Manager → **Test events** → copy the `TEST#####` code into
   `META_TEST_EVENT_CODE`, restart `npm run dev`.
2. Open a landing page in the same browser. **PageView** appears once, from
   the browser.
3. Scroll past halfway: **ViewContent**.
4. Submit the form. **Lead** appears from the browser and from the server and
   collapses into one row marked **Deduplicated**, with the server row showing
   matched `em`, `ph`, `fn`, `ln`, `country`, `external_id`, `fbp`.
5. In the dashboard, move that lead to MQL: **MQL** appears, server only.

**Blank `META_TEST_EVENT_CODE` before deploying.** Test events never count
toward optimisation; shipping with it set means a live pixel that learns
nothing.

### 4. In Events Manager, after go-live

- **Custom conversions per page.** `Lead` where URL contains `/clinic`, and
  the same for `/healthcare` and `/tepa`, so each campaign optimises for its
  own page's enquiries. Do the same for `MQL` and `SQL` when they have
  volume. `content_category` is also available as a rule parameter.
- **Campaign optimisation.** Optimise for `Lead` (per-page custom conversion)
  until a later stage produces roughly 50 events a week per ad set; below
  that Meta's learning phase never completes. `ViewContent` is the fallback
  while the Lead pool builds.
- **Conversion Leads.** For lead-generation campaigns, Events Manager's
  *Conversion Leads* setup maps `Lead → MQL → SQL → Purchase` as one funnel so
  delivery is optimised for leads that go on to qualify, not just leads.
- **Event Match Quality.** Below 5.0 on `Lead` usually means phones are
  arriving without a country code or the server is not seeing the visitor's
  IP (`x-forwarded-for` missing behind the proxy).

---

## Operating it

### Retrying failures

Same outbox, same endpoint as Google:

```bash
curl -X POST https://<host>/api/conversions/process \
  -H "Authorization: Bearer $CONVERSIONS_CRON_SECRET"
```

Rows are retried up to 5 times. Meta rows carry `destination = 'meta'`:

```sql
SELECT destination, stage, status, attempts, left(last_error, 120) AS error, created_at
FROM conversion_uploads ORDER BY created_at DESC LIMIT 20;
```

### Demo leads

Seeded rows are skipped for Meta exactly as for Google.

---

## Troubleshooting

| Symptom | Cause |
| --- | --- |
| `code 190` | Token invalid or revoked. Generate a new one (step 1) and update `.env` on the server |
| `code 100/2804003 … Timestamp Too Old` | Row sat in the outbox more than 7 days. Settled as skipped; nothing to do |
| `code 100 … Missing Permission` | Token was generated for a different dataset |
| `Lead has nothing Meta can match on` | Direct API post with no usable contact details. Expected for junk |
| Browser and server `Lead` show as two rows in Test events | `event_id` mismatch. Something else fires `Lead` on the page |
| Events arrive but nothing in *Overview* | `META_TEST_EVENT_CODE` is still set |
| Match quality low on stage events | The lead's enquiry came in without `_fbp` (pixel blocked) and with an unusable phone; only email and name are left to match on |
