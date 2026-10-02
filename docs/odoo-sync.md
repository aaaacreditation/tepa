# Odoo CRM sync

Every lead from the landing pages is copied into AAA's Odoo CRM
(`aaa-acc1.odoo.com`) as an opportunity in stage **New**. Sales then works it
in Odoo. Code: `lib/odoo.ts`.

## Who does what

- **The portal** creates or finds the Odoo record and tags it. It never emails
  a lead.
- **Odoo** sends every email. The Marketing Automation campaigns
  "TEPA – Lead Nurture (Email)" and "Healthcare – Lead Nurture (Email)" pick up
  records tagged `Nurture: TEPA` / `Nurture: Healthcare` in stage New. Their
  opened / clicked / replied branching only works on email Odoo sent.

## What a new record looks like

| Odoo field | Value |
|---|---|
| Type / stage / team | Opportunity / New / Sales |
| Name | Organisation (full name if empty) |
| Contact, company, email, phone, job position, website, country | From the form |
| Source / medium | `AAA Landing Pages` / `Google Adwords`, `Facebook` or `Website`, by the ad click (`lib/channels.ts`) |
| Tags | Product (`TEPA` or `Healthcare Accreditation`), `Contact: WhatsApp` / `Contact: Phone call` / `Contact: Email` when the form asked, and the nurture tag when enabled |
| Salesperson | Sara Morgan for healthcare and clinic; on TEPA, Adam Malom for the US and Babita Singh for India and the Middle East; anyone else unassigned (`ownerFor()` in `lib/odoo.ts`) |
| Notes | The form answers, the ad campaign and keyword, and `(portal lead #123)` |

If an active Odoo record already has the same email, nothing new is created.
The sync posts an internal note on that record ("submitted the form again")
and links the dashboard lead to it.

## Settings (never committed)

On the server they live in `/opt/tepa/app/.env.production.local` (mode 600,
owned by `tepa`). That file sits apart from `.env`, which holds the database and
ad platform credentials and is never edited. Next loads both files at
`next start`. Locally they go in `.env.local`.

```
ODOO_URL=https://aaa-acc1.odoo.com
ODOO_DB=aaa-acc1
ODOO_API_KEY=...            # Odoo user -> Preferences -> Account Security
ODOO_LOGIN=...              # the key's owner; unused by JSON-2, kept for XML-RPC
ODOO_NURTURE=off            # off | all | email
ODOO_SYNC_PAUSED=           # 1 = keep queueing, send nothing (kill switch)
```

Changing any of these needs `systemctl restart tepa`, not a rebuild.

Keep `ODOO_NURTURE=off` until both campaigns are **running** in Odoo. A tag
added while a campaign is in draft starts the sequence days late, when someone
presses Start.

## Delivery and retries

Each enquiry writes an `odoo_sync` row next to the lead and sends it after the
response. The server's ten-minute `tepa-conversions.timer` calls
`/api/conversions/process`, which retries up to 25 Odoo rows per run. A lead
that still has not reached Odoo after 12 attempts (about two hours), or that
Odoo rejects outright, turns **Failed**. The dashboard shows the reason under
**Odoo** in the lead's details. Once the cause is fixed, send it again:

```sql
UPDATE odoo_sync SET status = 'pending', attempts = 0 WHERE status = 'failed';
```

Preview what the sync would send for one lead, without sending it:

```
curl -H "Authorization: Bearer $CONVERSIONS_CRON_SECRET" \
  "http://127.0.0.1:3000/api/odoo/preview?leadId=123"
```

## Backfill

`node scripts/odoo-backfill.mjs` does a dry run and prints counts.
`--apply` queues the old leads, and the drain sends them. See the script
header for the matching and nurture rules.
