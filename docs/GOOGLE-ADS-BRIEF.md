# TEPA × Google Ads — project brief

**Read this first if you are picking up this project.** It is the strategy, the
current state, and the constraints. The operational commands live in
`.claude/skills/google-ads/SKILL.md`; the technical detail lives in
`docs/google-ads-conversions.md`.

Last verified: **2026-07-31**. Commit `4a0ca09`.

---

## 1. What this project is

A landing page at `/tepa` selling **accreditation for training and education
providers**, run by the American Accreditation Association. Traffic comes from
Google Ads. Enquiries land in Postgres and are worked through a pipeline in an
internal dashboard at `/dashboard`.

Two conversion paths exist for a visitor:

- **Submit the enquiry form** → becomes a lead in the dashboard
- **Book a call on Calendly** → an outbound link, never touches the server

## 2. The problem being solved

Google Ads could previously only see *"someone submitted a form"*. It could not
distinguish a student enquiry from an organisation that paid for accreditation.
So Smart Bidding optimised for **form fills**, and bid hardest on the keywords
that produced the most enquiries — not the most revenue.

The fix is **offline conversion import**: capture Google's click identifier
(`gclid`) when the visitor lands, store it with the lead, and later — when a
human moves that lead through the pipeline — tell Google *"the click you charged
us for became a $2000 customer"*.

Google then attributes that value back to the original campaign, ad group and
keyword, and bids accordingly.

## 3. The strategy: a conversion ladder

Four stages are reported, each with a value:

| Stage | Conversion action | ID | Value | Fires when |
| --- | --- | --- | --- | --- |
| Lead | TEPA Enquiry | `7703930540` | $0 | Form submitted |
| MQL | TEPA MQL | `7703235731` | $50 | Moved to MQL in dashboard |
| SQL | TEPA SQL | `7703235734` | $250 | Moved to SQL |
| Customer | TEPA Customer | `7703235737` | $2000 | Moved to Customer |

**All four report from day one, always.** Only one is *primary* at a time.

### Why only one is primary

Smart Bidding optimises against **primary** goals only; secondary goals are
measured but do not steer bidding. It needs roughly **30 conversions a month**
to learn.

Making *Customer* primary at launch would give Google two or three signals a
month, each arriving weeks after the click. It would never leave the learning
phase and would bid badly. So the ladder is climbed upward as volume allows.

### Current rung: `lead`

```
TEPA Enquiry    PRIMARY      ← bidding optimises for this
TEPA MQL        secondary
TEPA SQL        secondary
TEPA Customer   secondary
```

### When to climb

Promote the next stage when it reliably produces **~30 conversions a month**.
Below about 15, do not — the algorithm starves.

```bash
npm run ads:actions -- --primary=mql            # preview, changes nothing
npm run ads:actions -- --primary=mql --create   # apply
```

Three things to hold on to:

1. **Each switch costs 1–2 weeks** of unstable performance while bidding
   relearns. Do not change goals more often than that, and do not react to the
   dip inside that window.
2. **There is no cold start.** Every stage keeps uploading whatever the goal is,
   so Google already holds months of history when a stage is promoted.
3. **Customer may never be the right end state.** For a high-ticket B2B service,
   30 customers a month is unrealistic. **SQL is a perfectly good resting
   place** — far closer to revenue than a raw form fill. Do not force the last
   rung with thin data.

## 4. How it works

### Capture (the linchpin)

`AttributionCapture` runs on every `/tepa` visit, reads `gclid` / `gbraid` /
`wbraid` and the `utm_*` parameters from the URL, and writes them to a
first-party cookie for **90 days** — matching Google's default click lookback.

The enquiry route reads that cookie server-side and stores it on the lead row.

**If this fails, nothing downstream can work.** A conversion with no click
identifier cannot be attributed to the ad that paid for it. Leads arriving
without one still upload, matched on a SHA-256 hashed email (enhanced
conversions for leads), but the match rate is lower.

### Report

A status change writes a row to the `conversion_uploads` outbox **in the same
request** that moves the lead, then the upload happens *after* the response via
`after()`.

Uploading inline would mean a Google outage either blocks the dashboard or
loses the conversion. With the outbox, the row survives, the lead panel shows it
as failed, and it retries.

- `dedupe_key` is `leadId:stage` — demoting and re-promoting cannot double count
- Rows are claimed with an **atomic UPDATE**, not `SELECT ... FOR UPDATE`: every
  query commits on its own connection, so a lock would release before the
  follow-up write and let two senders upload the same conversion
- Promoting straight to Customer backfills MQL and SQL, because the lead did
  pass through those stages and Google needs each milestone
- Demo leads (`is_demo`) are never reported

### Calendly

Tracked in the browser only, via `gtag`, using one delegated click listener. It
has to be client-side — booking a call never reaches the server.

## 5. Hard constraints

Getting any of these wrong costs hours. They were all discovered the expensive
way.

- **Use the Data Manager API, never the Google Ads API, for uploads.**
  `ConversionUploadService.UploadClickConversions` closed to new integrations on
  15 June 2026. This account returns
  `CUSTOMER_NOT_ALLOWLISTED_FOR_THIS_FEATURE` — verified directly.
- **The account type enum is `GOOGLE_ADS`.** Google's own documentation says
  `GOOGLE_ADS_ACCOUNT`; the API rejects it.
- **The developer token is not used at runtime.** Data Manager authorises on
  OAuth and account linkage alone. It is only needed by `ads:actions`.
- **The refresh token needs two scopes**: `datamanager` for uploads, `adwords`
  for `ads:actions`. A token with only `adwords` authenticates and then 403s.
- **Never set both `GOOGLE_ADS_ACTION_LEAD` and
  `NEXT_PUBLIC_GOOGLE_ADS_LABEL_FORM`.** Two routes to the same event; every
  enquiry would count twice. The form is reported server-side, so `LABEL_FORM`
  is intentionally blank.
- **A newly created conversion action 400s with `Resource not found`** for a
  while before Data Manager sees it. That is handled — `NOT_FOUND` retries
  rather than being treated as permanent.
- **This project must not live under `~/Documents`.** It is iCloud-synced, and
  CleanMyMac's storage optimisation evicts file contents, corrupting
  `node_modules` and `.git`. It now lives at `~/Projects/tepa`.

## 6. Current state

### Working and verified live

- All four conversion actions exist, enabled, in account `6578203282`
- Credentials valid; token carries both scopes
- Data Manager accepted a `validateOnly` event for **every** stage
- Neon production database migrated; schema is idempotent
- Build, typecheck and lint clean

### Open — in priority order

1. **Publish the OAuth consent screen.** The current refresh token expires
   **2026-08-06** because the screen is still in *Testing*. Conversions stop
   silently when it lapses. Google Auth Platform → Audience → Publish, then
   `npm run ads:auth`, then update `.env.local` **and Vercel**.
2. **Rotate credentials.** The Neon password, Google client secret, refresh
   tokens and a GitHub PAT were all shared in plaintext during setup.
3. **Deploy to Vercel.** Environment variables are listed in
   `docs/google-ads-conversions.md`. `DATABASE_URL` must be the Neon **pooled**
   URL; `localhost` will not work.
4. **Add a scheduled retry.** Nothing currently drains the outbox on a timer.
   A Vercel Cron hitting `POST /api/conversions/process` every 15 minutes would
   let transient failures heal unattended.
5. **Decide on Calendly tracking.** `NEXT_PUBLIC_GOOGLE_ADS_ID` and
   `NEXT_PUBLIC_GOOGLE_ADS_LABEL_CALENDLY` are set locally but the tag only
   loads in production. Booking clicks are uncounted until deployed.

### Not yet proven

- **No real conversion has reached Google.** Every test so far has been
  `validateOnly`, which Google authorises and discards. The first genuine
  upload happens when a real lead moves stage on a deployed site.
- The dashboard status-change path has been verified by typecheck, build and the
  outbox SQL, but not clicked through in a browser end to end.

## 7. Commands

```bash
npm run ads:check                    # config, credentials, token expiry
npm run ads:check -- --send-test     # plus a live validateOnly ingest
npm run ads:auth                     # mint a refresh token
npm run ads:actions                  # list actions and which is PRIMARY
npm run ads:actions -- --primary=<stage> --create   # climb the ladder
npm run dev                          # http://localhost:3000/tepa
```

`GOOGLE_ADS_VALIDATE_ONLY=true` makes the sender dry-run against production
without recording anything. Never leave it set in production.

## 8. Working on this project

- Read `AGENTS.md` first. This is **Next.js 16** and it differs from what you
  likely know — `proxy.ts` replaces `middleware.ts`, `after()` comes from
  `next/server`, `refresh()` from `next/cache`. Check
  `node_modules/next/dist/docs/` before writing code.
- Brand: navy `#1f5993`, gold accent. No hyphens joining words in copy.
- Creating or repointing conversion actions writes to a **live ad account**.
  Always preview first and confirm before `--create`.
- Do not claim tracking works without running `--send-test` and seeing it pass.
