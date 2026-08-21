# Prompt: make MQL mean something

Copy everything below the line into a fresh Claude session opened in
`/Users/mounirbennassar/projects/tepa`.

---

## Context

This project captures leads from the TEPA landing page (`/tepa`) and reports
pipeline stages back to Google Ads through the Data Manager API. Stages are
`lead → mql → sql → customer`, defined in `lib/lead-status.ts` and moved by hand
in the dashboard.

**The problem:** over the last 90 days, 32 of 34 leads were marked MQL — **94%**.
A stage that 94% of leads pass is not a qualification, it is a rubber stamp. It
tells Google Ads nothing, so Smart Bidding cannot learn which clicks produce real
business. By contrast SQL sits at 21%, which looks like genuine judgement.

The cause: MQL is a manual button with no criteria attached, so whoever processes
leads clicks it to mean "I have seen this", not "this qualifies".

**Target:** MQL should be roughly 30–50% of leads. It should mean *"a real
training provider worth a salesperson's time."*

## What AAA actually sells

TEPA accredits **organizations that deliver training**: training centres,
professional academies, corporate training departments, online learning
providers, industry associations. It does **not** accredit individuals, and it
does not grant degrees. An individual looking for a course to attend is the
single most common wrong-fit lead, in every market.

## Goal

Give the person working the dashboard the information to qualify correctly, and
automatically exclude the obviously wrong-fit leads, without changing what is
already reported to Google Ads for the `lead` stage.

## Task 1 — three new form fields

Add to the TEPA enquiry form (`app/(frontend)/tepa/components/EnquiryForm.tsx`):

1. **Organization type** (select, required)
   `Training centre` · `Professional academy` · `Corporate training department` ·
   `Online learning provider` · `Industry association` · `Other` ·
   **`I am an individual looking for a course`**

2. **Programs to accredit** (select, required)
   `1–2` · `3–5` · `6–10` · `More than 10` · `Not sure yet`

3. **Your role** (select, required)
   `Owner / General Manager` · `Quality Manager` · `Training Manager` ·
   `Marketing` · `Other` · **`Student / Trainee`**

The two bolded options are deliberate: they let wrong-fit visitors identify
themselves instead of us guessing. Keep them plainly worded, not hidden.

Persist all three on the `leads` table. Follow the existing schema pattern in
`lib/db.ts`: idempotent DDL (`ALTER TABLE ... ADD COLUMN IF NOT EXISTS`) inside
the `SCHEMA` string, defaulting to `''` like the other text columns, so existing
rows stay valid. Update `lib/leads.ts` and the enquiry route
`app/api/tepa/enquiry/route.ts` to accept and store them.

## Task 2 — a qualification score computed at submit time

Add `lib/qualification.ts` exporting something like:

```ts
export type Qualification = {
  score: number;                  // 0-100
  tier: "disqualified" | "weak" | "qualified" | "strong";
  reasons: string[];              // human readable, shown in the dashboard
};
export function scoreLead(lead: LeadInput): Qualification;
```

Signals, all from data we already capture or are adding:

**Hard disqualifiers** (tier `disqualified` regardless of score):
- `organization_type` is `I am an individual looking for a course`
- `role` is `Student / Trainee`
- free email domain (gmail, yahoo, hotmail, outlook, icloud, live, aol, me.com)
  **and** no website — a real provider has at least one of the two

**Positive signals:**
- corporate email domain
- website present and parses as a domain
- organization name filled and not merely a copy of `full_name`
- programs to accredit is `3–5`, `6–10` or `More than 10`
- role is Owner / Quality Manager / Training Manager
- message mentions programs, courses, trainers, learners, curriculum

**Negative signals:**
- message reads as an individual asking to *take* a course
  (e.g. "I want a certificate", "how do I enrol", "course fees")
- free email domain
- programs `Not sure yet`

Country should **weight** the score, never disqualify. Do not hard-code a
country allow-list.

Store `qualification_score` and `qualification_tier` on the lead row at insert
time so the dashboard does not recompute on every render.

## Task 3 — surface it, do not automate the decision

In the dashboard (`app/dashboard/components/LeadsTable.tsx`):

- show the tier as a badge on each lead row
- show `reasons[]` in the lead detail panel, so the reviewer sees *why*
- allow sorting or filtering by tier
- when a lead is `disqualified`, require an explicit confirmation before it can
  be moved to MQL — do not block it outright, since judgement must win over a
  heuristic, but make the default path the correct one

**Do not auto-promote leads to MQL.** The score informs a human; it does not
replace them. Auto-promotion would recreate the same problem in a new form.

## Constraints

- **Do not change the `lead`-stage conversion upload.** The enquiry route already
  enqueues it via `lib/conversions.ts`; that behaviour and its dedupe key must
  stay exactly as they are.
- **Do not enqueue any new conversion** as part of this work. MQL/SQL/Customer
  continue to upload only when a human moves the stage.
- Do not touch `NEXT_PUBLIC_GOOGLE_ADS_LABEL_*` or the gtag setup. The form
  labels are deliberately blank so the browser does not double-count what the
  server already reports.
- Keep `AttributionCapture` and gclid handling untouched — losing the click ID
  breaks all offline attribution.
- The healthcare and clinic enquiry routes share this shape. Scope this change to
  **TEPA only** for now, but structure `lib/qualification.ts` so a second source
  can adopt it later without a rewrite.
- Match the existing code style: raw `pg`, no ORM, server components where they
  already are, and the comment voice used elsewhere in `lib/`.

## Verification

1. `npm run build` passes.
2. Submit the form as a clear provider (corporate email, website, 6–10 programs,
   Quality Manager) → tier `strong` or `qualified`.
3. Submit as a clear individual (gmail, no website, "I am an individual looking
   for a course", Student / Trainee) → tier `disqualified` with readable reasons.
4. Existing leads with empty new columns still render and are still movable.
5. Confirm a `lead` conversion is still enqueued exactly once per submission, and
   that no MQL/SQL/Customer upload fires from this change.
6. Run `npm run ads:check` and confirm it still passes.

## Afterwards

Once real data accumulates, run this on production to see the true rate:

```sql
SELECT qualification_tier, status, COUNT(*)
FROM leads
WHERE is_demo = false AND created_at > now() - interval '90 days'
GROUP BY 1, 2 ORDER BY 1, 2;
```

If MQL is still above 70%, the criteria are still too loose.

## One thing to check first

`app/(frontend)/tepa/components/` contains duplicate files
(`EnquiryForm 2.tsx`, `MobileCta 2.tsx`, `SiteHeader 2.tsx`, `SiteFooter 2.tsx`).
Work out which are live before editing, and mention any dead duplicates rather
than silently editing the wrong one.
