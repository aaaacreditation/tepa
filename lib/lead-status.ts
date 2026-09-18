/* Client safe pipeline constants shared by the dashboard UI and the server
   data layer. Stage colors are an ordinal ramp on the brand navy, validated
   for monotone lightness and CVD separation against the white card surface. */

/* The pipeline proper, in order. Everything that reads a stage as a position
   rather than a name — the conversion backfill, the funnel counts — walks this
   array, so the order is load bearing. */
export const PIPELINE_STAGES = ["lead", "mql", "sql", "customer"] as const;
export type PipelineStage = (typeof PIPELINE_STAGES)[number];

/* The sales team's own checkpoint between Lead and MQL: the lead was picked
   up, an Odoo record was created, the client was contacted (email, call or
   WhatsApp) and replied with any acknowledgement. It is a status the board
   shows, not a stage the ad platforms hear about — it says the team did its
   job, not that the lead is worth more — so it stays out of PIPELINE_STAGES
   and queues no conversion. Promoting on to MQL reports MQL as usual. */
export const FIRST_CONTACT = "first_contact" as const;

/* Disqualification is an outcome, not a stage. It can be reached from anywhere
   in the pipeline, it never advances to anything, and it is deliberately kept
   out of PIPELINE_STAGES: a stage's index drives the conversion backfill, so a
   fifth entry there would report a rejected lead to Google and Meta as if it
   had converted — the exact opposite of what the bidding needs to learn. */
export const NOT_QUALIFIED = "not_qualified" as const;

/* A second enquiry from a lead already on the board. Like not qualified it is
   an exit rather than a stage, and the platforms never hear of it: the first
   enquiry was already reported, and reporting the copy would count one person
   twice. No reason is asked for; the status is the reason. */
export const DUPLICATED = "duplicated" as const;

/* Every value the status column may hold, in the order the dashboard shows
   them: the working statuses in pipeline order, then the two exits. */
export const LEAD_STATUSES = [
  "lead",
  FIRST_CONTACT,
  "mql",
  "sql",
  "customer",
  DUPLICATED,
  NOT_QUALIFIED,
] as const;
export type LeadStatus = (typeof LEAD_STATUSES)[number];

export const STATUS_LABEL: Record<LeadStatus, string> = {
  lead: "Lead",
  first_contact: "First contact",
  mql: "MQL",
  sql: "SQL",
  customer: "Customer",
  duplicated: "Duplicated",
  not_qualified: "Not qualified",
};

export const STAGE_COLORS: Record<LeadStatus, string> = {
  lead: "#6d9ccb",
  /* Halfway between lead and MQL on the ramp, which is where it sits. */
  first_contact: "#5489be",
  mql: "#3a76b2",
  sql: "#1a4c81",
  customer: "#0b2440",
  /* Both exits sit off the navy ramp on purpose: a closed lead is not a darker
     shade of progress. Neutral tones read as "filed" beside the blues without
     shouting the way a red would on a row someone merely filed correctly; the
     duplicate is warm and the rejection cool so the two stay apart in the
     bar list. */
  duplicated: "#b3a48c",
  not_qualified: "#93a1b0",
};

/* The ad platforms a stage is reported to. */
export const DESTINATIONS = ["google", "meta"] as const;
export type Destination = (typeof DESTINATIONS)[number];

export const DESTINATION_LABEL: Record<Destination, string> = {
  google: "Google Ads",
  meta: "Meta",
};

export function isLeadStatus(value: string): value is LeadStatus {
  return (LEAD_STATUSES as readonly string[]).includes(value);
}

export function isPipelineStage(value: string): value is PipelineStage {
  return (PIPELINE_STAGES as readonly string[]).includes(value);
}

/* ==========================================================================
   Disqualification reasons
   ========================================================================== */

/* Marking a lead not qualified without saying why loses the only piece of
   information the decision produces. "MQL is a rubber stamp" was diagnosed by
   counting stages; "we keep paying for individuals looking for a course" can
   only be diagnosed by reading these.

   The presets exist so the common answers stay countable instead of arriving
   as fifty spellings of the same sentence; the free text next to them is where
   anything the list does not cover goes. */
export const DISQUALIFY_REASONS = [
  "Individual, not a training provider",
  "Outside our accreditation scope",
  "No budget",
  "Not the decision maker",
  "Already accredited elsewhere",
  "Unreachable after follow up",
  "Duplicate enquiry",
  "Spam or test submission",
  "Other",
] as const;

export type DisqualifyReason = (typeof DISQUALIFY_REASONS)[number];

/* Long enough for a sentence of context, short enough that the column stays a
   label rather than a second notes field. */
export const MAX_REASON_LENGTH = 300;

/* One stored string out of the preset and the optional detail, so the reason
   reads as a sentence wherever it is shown and still starts with a countable
   prefix. "Other" contributes nothing but its detail. */
export function composeReason(preset: string, detail: string): string {
  const head = preset.trim() === "Other" ? "" : preset.trim();
  const tail = detail.trim();
  if (head && tail) return `${head} — ${tail}`.slice(0, MAX_REASON_LENGTH);
  return (head || tail).slice(0, MAX_REASON_LENGTH);
}
