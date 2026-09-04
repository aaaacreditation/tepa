import "server-only";
import { q } from "./db";
import {
  GoogleAdsError,
  ingestEvent,
  readConfig,
  type GoogleAdsConfig,
} from "./google-data-manager";
import {
  type Destination,
  isPipelineStage,
  type LeadStatus,
  PIPELINE_STAGES,
  type PipelineStage,
} from "./lead-status";
import {
  MetaCapiError,
  metaEventFor,
  readMetaConfig,
  sendMetaEvent,
  type MetaConfig,
} from "./meta-capi";
import { DEFAULT_SOURCE, getSource } from "./sources";

/* Pipeline stage changes reported back to the ad platforms as offline
   conversions: Google Ads through the Data Manager API, Meta through the
   Conversions API.

   The flow is deliberately two steps. A status change writes a row to the
   conversion_uploads outbox inside the same request that moved the lead, then
   a sender drains the outbox. Uploading inline would mean a platform outage,
   an expired token, or a slow response either blocks the dashboard or silently
   loses the conversion. With the outbox the row survives, the dashboard shows
   it as failed, and it can be retried.

   Each stage is queued once per platform and every row lives on its own, so a
   Meta outage cannot hold up Google's upload and a token fixed for one never
   needs the other's rows retried.

   Value telling the bidding what each stage is worth is the point of the
   exercise: a customer must outweigh a raw lead or the bidding cannot learn. */

/* Only a pipeline stage is ever reported to an ad platform. Disqualifying a
   lead is a decision about it, not a milestone it reached, so it has no
   conversion action, no value, and no row in the outbox. */
export type ConversionStage = PipelineStage;

export type StageConfig = {
  stage: ConversionStage;
  conversionActionId: string;
  value: number;
};

export type UploadRow = {
  id: number;
  leadId: number;
  stage: ConversionStage;
  destination: Destination;
  status: "pending" | "sending" | "sent" | "failed" | "skipped";
  attempts: number;
  lastError: string;
  value: string;
  currency: string;
  createdAt: string;
  sentAt: string | null;
};

const DEFAULT_VALUES: Record<ConversionStage, number> = {
  lead: 0,
  mql: 50,
  sql: 250,
  customer: 2000,
};

const ENV_ACTION: Record<ConversionStage, string> = {
  lead: "GOOGLE_ADS_ACTION_LEAD",
  mql: "GOOGLE_ADS_ACTION_MQL",
  sql: "GOOGLE_ADS_ACTION_SQL",
  customer: "GOOGLE_ADS_ACTION_CUSTOMER",
};

const ENV_VALUE: Record<ConversionStage, string> = {
  lead: "GOOGLE_ADS_VALUE_LEAD",
  mql: "GOOGLE_ADS_VALUE_MQL",
  sql: "GOOGLE_ADS_VALUE_SQL",
  customer: "GOOGLE_ADS_VALUE_CUSTOMER",
};

export function currency(): string {
  return (process.env.GOOGLE_ADS_CURRENCY || "USD").toUpperCase();
}

/* Dry run switch. Google fully parses and authorises the upload, then throws
   it away instead of recording it. Set it on staging, or to prove a credential
   change works without writing a fake conversion into the live ad account.
   Rows still move to 'sent', so leave it unset in production. */
export function validateOnly(): boolean {
  return process.env.GOOGLE_ADS_VALIDATE_ONLY === "true";
}

/* Each landing page reports into its own conversion actions, named by
   suffixing the variable with the source key — GOOGLE_ADS_ACTION_LEAD_CLINIC.
   The first page keeps the unsuffixed names it has always used.

   There is deliberately no fallback from a suffixed variable to the shared
   one. The live TEPA campaigns bid on whatever lands in TEPA's actions, so a
   page quietly pooling into them because its own variable was left blank would
   have Smart Bidding optimising TEPA against clinic leads — the exact conflict
   separate actions exist to prevent. An unconfigured stage is skipped and
   says so (nothing queued, WARN in ads:check) rather than misreported.

   Meta needs none of this: one pixel serves every page and Events Manager
   tells them apart by URL and content_category. */
function envSuffix(source: string): string {
  return `_${source.toUpperCase().replace(/[^A-Z0-9]+/g, "_")}`;
}

function actionIdFor(stage: ConversionStage, source: string): string {
  const key =
    source === DEFAULT_SOURCE ? ENV_ACTION[stage] : `${ENV_ACTION[stage]}${envSuffix(source)}`;
  return (process.env[key] ?? "").trim();
}

/* Values are only a weight, so a page without its own may share the default
   page's number, and both fall back to the built in defaults. */
function valueFor(stage: ConversionStage, source: string): string | undefined {
  if (source !== DEFAULT_SOURCE) {
    const scoped = process.env[`${ENV_VALUE[stage]}${envSuffix(source)}`];
    if (scoped !== undefined && scoped.trim()) return scoped;
  }
  return process.env[ENV_VALUE[stage]];
}

/* What a stage is worth. The numbers live under the GOOGLE_ADS_VALUE_* names
   they were born with, but a value is a statement about the business, not a
   platform setting, so Meta reports the same one. */
export function stageValue(stage: ConversionStage, source: string = DEFAULT_SOURCE): number {
  const raw = valueFor(stage, source);
  const parsed = raw === undefined ? Number.NaN : Number(raw);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : DEFAULT_VALUES[stage];
}

/* A stage is only reported to Google when it has a conversion action id.
   Leaving one unset is the supported way to opt a stage out, which matters
   for 'lead': most setups already count the form submit with the gtag snippet
   in the browser, and reporting it here too would count it twice. */
export function stageConfig(
  stage: ConversionStage,
  source: string = DEFAULT_SOURCE,
): StageConfig | null {
  const conversionActionId = actionIdFor(stage, source);
  if (!conversionActionId) return null;
  return { stage, conversionActionId, value: stageValue(stage, source) };
}

export function configuredStages(source: string = DEFAULT_SOURCE): StageConfig[] {
  return PIPELINE_STAGES.map((stage) => stageConfig(stage, source)).filter(
    (s): s is StageConfig => s !== null,
  );
}

/* ==========================================================================
   Enqueue
   ========================================================================== */

/* One row per lead, stage and platform, forever. Demoting a lead and
   promoting it again re-enters the same key, and ON CONFLICT DO NOTHING makes
   that a no-op rather than a second conversion for the same milestone.

   Google's key is unprefixed because it doubles as the transaction id Google
   deduplicates on; rows already sent under it must keep matching. */
const dedupeKey = (leadId: number, stage: ConversionStage, destination: Destination) =>
  destination === "google" ? `${leadId}:${stage}` : `${destination}:${leadId}:${stage}`;

/* Which conversion action a stage reports into depends on the landing page the
   lead came from, and the caller does not always know it — the dashboard moves
   a lead by id alone. Reading it back keeps every call site the same shape. */
async function leadSource(leadId: number): Promise<string | null> {
  const rows = await q<{ source: string }>("SELECT source FROM leads WHERE id = $1", [
    leadId,
  ]);
  return rows.length > 0 ? rows[0].source : null;
}

export type EnqueueOptions = {
  /* The id the pixel fired the browser half of the enquiry with. Only the
     lead stage has one; Meta collapses the two halves on it. */
  metaEventId?: string;
};

export async function enqueueConversion(
  leadId: number,
  stage: ConversionStage,
  occurredAt: Date = new Date(),
  knownSource?: string,
  options: EnqueueOptions = {},
): Promise<boolean> {
  const source = knownSource ?? (await leadSource(leadId));
  if (source === null) return false;

  const rows: Array<{ destination: Destination; value: number; eventId: string }> = [];

  const google = stageConfig(stage, source);
  if (google) rows.push({ destination: "google", value: google.value, eventId: "" });

  /* Meta queues whenever its token is present and the stage's event is not
     switched off; there is no per page action to be missing. */
  if (readMetaConfig().ok && metaEventFor(stage)) {
    const browserId = stage === "lead" ? options.metaEventId : undefined;
    rows.push({
      destination: "meta",
      value: stageValue(stage, source),
      eventId: browserId || dedupeKey(leadId, stage, "meta"),
    });
  }

  let queued = false;
  for (const row of rows) {
    const inserted = await q<{ id: number }>(
      `INSERT INTO conversion_uploads
         (lead_id, stage, dedupe_key, value, currency, occurred_at, destination, event_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (dedupe_key) DO NOTHING
       RETURNING id`,
      [
        leadId,
        stage,
        dedupeKey(leadId, stage, row.destination),
        row.value,
        currency(),
        occurredAt,
        row.destination,
        row.eventId,
      ],
    );
    if (inserted.length > 0) queued = true;
  }
  return queued;
}

/* Promotions can skip steps: dragging a lead straight to customer still passed
   through mql and sql in business terms, and the platforms need each milestone
   to learn the funnel. Backfilling the intermediate stages keeps the reported
   funnel consistent with the dashboard's own "reached" counts. */
export async function enqueueStageAndBackfill(
  leadId: number,
  stage: LeadStatus,
  occurredAt: Date = new Date(),
): Promise<number> {
  /* Not qualified reports nothing. There is no way to retract a conversion
     already uploaded for an earlier stage, and nothing new is owed: the lead
     stage stays true — the enquiry did happen — and the platforms simply never
     hear about a promotion that never came. */
  if (!isPipelineStage(stage)) return 0;

  const target = PIPELINE_STAGES.indexOf(stage);

  /* Resolved once and threaded through, rather than re-read for each stage. */
  const source = await leadSource(leadId);
  if (source === null) return 0;

  let queued = 0;
  for (let i = 0; i <= target; i += 1) {
    if (await enqueueConversion(leadId, PIPELINE_STAGES[i], occurredAt, source)) queued += 1;
  }
  return queued;
}

/* ==========================================================================
   Send
   ========================================================================== */

const MAX_ATTEMPTS = 5;

/* How long a claimed row may sit in 'sending' before another sender may take
   it. Long enough that a slow platform response is never stolen mid flight,
   short enough that a killed process does not strand a conversion. */
const STALE_CLAIM_SECONDS = 300;

type PendingJob = {
  id: number;
  leadId: number;
  stage: ConversionStage;
  destination: Destination;
  eventId: string;
  value: string;
  currency: string;
  occurredAt: string;
  attempts: number;
  fullName: string;
  email: string;
  phone: string;
  countryCode: string;
  gclid: string;
  gbraid: string;
  wbraid: string;
  fbp: string;
  fbc: string;
  clientIp: string;
  clientUserAgent: string;
  landingPath: string;
  isDemo: boolean;
  source: string;
};

type SendOutcome = { requestId: string; warnings: string[] };

export type DrainResult = {
  processed: number;
  sent: number;
  failed: number;
  skipped: number;
  reason?: string;
};

export async function drainConversions(limit = 25): Promise<DrainResult> {
  const empty: DrainResult = { processed: 0, sent: 0, failed: 0, skipped: 0 };

  /* Only rows for a platform whose credentials are present are claimed; the
     rest wait in the outbox for the day they are. */
  const google = readConfig();
  const meta = readMetaConfig();
  const ready: Destination[] = [];
  if (google.ok) ready.push("google");
  if (meta.ok) ready.push("meta");
  if (ready.length === 0) {
    const missing = [...(google.ok ? [] : google.missing), ...(meta.ok ? [] : meta.missing)];
    return { ...empty, reason: `No ad platform is configured. Missing ${missing.join(", ")}.` };
  }

  /* Claim rows with a single atomic UPDATE rather than a SELECT ... FOR UPDATE.
     Every query here runs on its own pooled connection and commits on its own,
     so a lock taken by the SELECT would be released the moment it returned and
     would guarantee nothing across the UPDATE that follows. Flipping status to
     'sending' in one statement is what actually reserves the row, so the
     after() sender and a cron retry cannot both upload the same conversion.

     Rows stuck in 'sending' past the stale window belong to a sender that was
     killed mid flight and are reclaimed. */
  const claimed = await q<{ id: number }>(
    `UPDATE conversion_uploads
     SET status = 'sending', attempts = attempts + 1, claimed_at = now()
     WHERE id IN (
       SELECT id FROM conversion_uploads
       WHERE attempts < $2
         AND destination = ANY($4::text[])
         AND (
           status IN ('pending', 'failed')
           OR (status = 'sending' AND claimed_at < now() - make_interval(secs => $3))
         )
       ORDER BY created_at ASC
       LIMIT $1
       FOR UPDATE SKIP LOCKED
     )
     RETURNING id`,
    [limit, MAX_ATTEMPTS, STALE_CLAIM_SECONDS, ready],
  );

  if (claimed.length === 0) return { ...empty };

  const jobs = await q<PendingJob>(
    `SELECT c.id,
            c.lead_id  AS "leadId",
            c.stage,
            c.destination,
            c.event_id AS "eventId",
            c.value,
            c.currency,
            c.occurred_at AS "occurredAt",
            c.attempts,
            l.full_name AS "fullName",
            l.email,
            l.phone,
            l.country_code AS "countryCode",
            l.gclid,
            l.gbraid,
            l.wbraid,
            l.fbp,
            l.fbc,
            l.client_ip AS "clientIp",
            l.client_user_agent AS "clientUserAgent",
            l.landing_path AS "landingPath",
            l.is_demo  AS "isDemo",
            l.source
     FROM conversion_uploads c
     JOIN leads l ON l.id = c.lead_id
     WHERE c.id = ANY($1::int[])
     ORDER BY c.created_at ASC`,
    [claimed.map((row) => row.id)],
  );

  const result: DrainResult = { ...empty, processed: jobs.length };

  for (const job of jobs) {
    /* Seeded demo rows exist to make the dashboard look alive. Sending them
       would teach the bidding on fiction. */
    if (job.isDemo) {
      await q(
        `UPDATE conversion_uploads
         SET status = 'skipped', last_error = 'Demo lead, not reported.'
         WHERE id = $1`,
        [job.id],
      );
      result.skipped += 1;
      continue;
    }

    try {
      const outcome =
        job.destination === "meta"
          ? await sendToMeta(meta.ok ? meta.config : null, job)
          : await sendToGoogle(google.ok ? google.config : null, job);

      /* attempts was already incremented when the row was claimed. */
      await q(
        `UPDATE conversion_uploads
         SET status = 'sent',
             sent_at = now(),
             request_id = $2,
             last_error = $3
         WHERE id = $1`,
        [job.id, outcome.requestId, outcome.warnings.join(" | ")],
      );
      result.sent += 1;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const permanent =
        (error instanceof GoogleAdsError || error instanceof MetaCapiError) &&
        !error.retryable;
      const attempts = job.attempts;

      /* A permanently unmatched conversion is settled, not pending. Marking it
         skipped stops it being retried forever and keeps the failed count
         meaning "something needs a human". */
      const nextStatus = permanent
        ? "skipped"
        : attempts >= MAX_ATTEMPTS
          ? "failed"
          : "pending";

      await q(
        `UPDATE conversion_uploads
         SET status = $2, last_error = $3
         WHERE id = $1`,
        [job.id, nextStatus, message],
      );

      if (nextStatus === "skipped") result.skipped += 1;
      else result.failed += 1;

      console.error(
        `[conversions] ${job.destination} lead ${job.leadId} stage ${job.stage} attempt ${attempts}: ${message}`,
      );
    }
  }

  return result;
}

async function sendToGoogle(
  config: GoogleAdsConfig | null,
  job: PendingJob,
): Promise<SendOutcome> {
  if (!config) {
    throw new GoogleAdsError("Google Ads credentials are not configured.", 0, true);
  }

  const action = stageConfig(job.stage, job.source);
  if (!action) {
    throw new GoogleAdsError(
      `No conversion action configured for stage "${job.stage}" on /${job.source}.`,
      0,
      false,
    );
  }

  const outcome = await ingestEvent(
    config,
    {
      conversionActionId: action.conversionActionId,
      transactionId: dedupeKey(job.leadId, job.stage, "google"),
      occurredAt: new Date(job.occurredAt),
      value: Number(job.value),
      currency: job.currency,
      gclid: job.gclid,
      gbraid: job.gbraid,
      wbraid: job.wbraid,
      email: job.email,
      phone: job.phone,
    },
    { validateOnly: validateOnly() },
  );
  return { requestId: outcome.requestId, warnings: outcome.warnings };
}

/* Where the landing pages live, for the event_source_url Meta requires on a
   website event. The path comes from the lead when the visit was tagged, and
   from the source registry otherwise. */
const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://campaigns.aaa-accreditation.org"
).replace(/\/$/, "");

async function sendToMeta(config: MetaConfig | null, job: PendingJob): Promise<SendOutcome> {
  if (!config) {
    throw new MetaCapiError("Meta Conversions API token is not configured.", 0, true);
  }

  const eventName = metaEventFor(job.stage);
  if (!eventName) {
    throw new MetaCapiError(`The Meta event for stage "${job.stage}" is switched off.`, 0, false);
  }

  const source = getSource(job.source);
  const isLead = job.stage === "lead";

  /* The enquiry is a website event, carrying everything the pixel would have:
     the page, the connection, the pixel's cookies. A later stage is what Meta
     calls system generated — reported by a CRM, no browser involved — and is
     matched on the contact details and the cookies saved at enquiry time. The
     event_source and lead_event_source keys are Meta's convention for CRM
     stage events, which is what lets Events Manager treat them as one funnel
     with the Lead that started it. */
  const outcome = await sendMetaEvent(config, {
    eventName,
    eventId: job.eventId || dedupeKey(job.leadId, job.stage, "meta"),
    eventTime: new Date(job.occurredAt),
    actionSource: isLead ? "website" : "system_generated",
    eventSourceUrl: isLead
      ? `${SITE_URL}${job.landingPath || source?.path || `/${job.source}`}`
      : undefined,
    user: {
      email: job.email,
      phone: job.phone,
      fullName: job.fullName,
      country: job.countryCode,
      externalId: String(job.leadId),
      fbp: job.fbp,
      fbc: job.fbc,
      ...(isLead ? { clientIp: job.clientIp, clientUserAgent: job.clientUserAgent } : {}),
    },
    customData: {
      content_name: source?.name ?? job.source,
      content_category: job.source,
      value: Number(job.value),
      currency: job.currency,
      ...(isLead ? {} : { event_source: "crm", lead_event_source: "AAA Leads Dashboard" }),
    },
  });

  return {
    requestId: outcome.traceId,
    warnings:
      outcome.eventsReceived === 1 ? [] : [`Meta reported events_received=${outcome.eventsReceived}`],
  };
}

/* ==========================================================================
   Read side
   ========================================================================== */

export async function getUploadsForSource(source: string): Promise<UploadRow[]> {
  return q<UploadRow>(
    `SELECT c.id,
            c.lead_id AS "leadId",
            c.stage,
            c.destination,
            c.status,
            c.attempts,
            c.last_error AS "lastError",
            c.value::text AS value,
            c.currency,
            to_char(c.created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS "createdAt",
            to_char(c.sent_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"')    AS "sentAt"
     FROM conversion_uploads c
     JOIN leads l ON l.id = c.lead_id
     WHERE l.source = $1
     ORDER BY c.created_at DESC
     LIMIT 2000`,
    [source],
  );
}
