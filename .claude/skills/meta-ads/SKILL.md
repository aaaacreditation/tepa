---
name: meta-ads
description: Review and control the Meta pixel and Conversions API tracking for the AAA landing pages (/tepa, /healthcare, /clinic). Use when the user asks to check Meta, Facebook or Instagram tracking, whether Lead events reach Meta, why Events Manager shows nothing or shows duplicates, how to rename or switch off a stage event (MQL/SQL/Purchase), how to replace the CAPI token, or how to retry failed Meta uploads.
---

# Meta pixel + Conversions API — review and control

Read `docs/meta-conversions.md` for how it works; this is the runbook.

## Facts

| | |
| --- | --- |
| Dataset | **AAA - Landing Pages** `1104633055225029` |
| Business portfolio | `1430378177170499` |
| Ad account | `594547015783583` |
| Token | System user token from the dataset's Conversions API panel, no expiry, `META_CAPI_ACCESS_TOKEN` |
| Graph API | `v26.0` (`META_GRAPH_VERSION`) |
| Browser events | PageView, ViewContent, Lead (with event id), Schedule (Calendly, /tepa) |
| Server events | Lead (same event id as the browser), MQL, SQL, Purchase |
| Stage → event | `META_EVENT_<STAGE>`; unset = Lead / MQL / SQL / Purchase; `off` silences |

One dataset for all pages. Pages are separated in Events Manager by URL and
`content_category`, never in code.

## Step 1 — always start here

```bash
npm run meta:check                 # token, dataset write access, event names
npm run meta:check -- --send-test  # plus one flagged test Lead (needs META_TEST_EVENT_CODE)
```

The write-access check sends an event nine days old: Meta authorises it and
refuses it for its age, so nothing is recorded. Do not claim tracking works
unless that check says PASS.

`--send-test` without `META_TEST_EVENT_CODE` sends nothing on purpose; a real
Lead would pollute the dataset. Ask the user for the code from Events Manager
→ Test events, and remind them to blank it again before it reaches the server.

## Step 2 — interpret

| Symptom | Meaning | Fix |
| --- | --- | --- |
| `code 190` | token dead | new token from Events Manager → Settings → Conversions API, then update `/opt/tepa/app/.env` and `systemctl restart tepa.service` |
| `Missing Permission` | token belongs to another dataset | regenerate from this dataset's panel |
| `Timestamp Too Old` | row waited more than 7 days | settled as skipped; nothing to do |
| two `Lead` rows in Test events, not deduplicated | event ids differ | something else fires `fbq('track','Lead')`; only `metaTrack` should |
| events in Test events but not in Overview | `META_TEST_EVENT_CODE` still set | blank it |

## Step 3 — outbox

Failed uploads show per lead in the dashboard under **Ad platform
conversions**, tagged *Meta*. Directly:

```sql
SELECT destination, stage, status, attempts, left(last_error,120), created_at
FROM conversion_uploads WHERE destination = 'meta' ORDER BY created_at DESC LIMIT 20;
```

Force a retry (same endpoint as Google, drains both platforms):

```bash
curl -X POST https://<host>/api/conversions/process -H "Authorization: Bearer $CONVERSIONS_CRON_SECRET"
```

## Guardrails

- `META_CAPI_ACCESS_TOKEN` is a secret: never `NEXT_PUBLIC_`, never committed,
  never pasted into a chat if it can be avoided. A pasted token should be
  regenerated afterwards.
- `NEXT_PUBLIC_META_PIXEL_ID` is inlined at build time; changing it means a
  deploy, not a restart.
- Never add a second `fbq('track', 'Lead')` anywhere. The browser Lead must
  carry the id the form posted to the server, or Meta counts every enquiry
  twice.
- Do not "Connect now" the *Web-only · Connection pending* relay in Events
  Manager. It would duplicate the server events with no id to dedupe on.
- Changing which custom conversion a campaign optimises for is a live change
  to ad delivery. Preview and confirm with the user first.
