import "server-only";
import { q } from "./db";
import {
  GoogleAdsError,
  ingestEvent,
  isConfigured,
  readConfig,
} from "./google-data-manager";
import { LEAD_STATUSES, type LeadStatus } from "./lead-status";

/* Pipeline stage changes reported back to Google Ads as offline conversions.

   The flow is deliberately two steps. A status change writes a row to the
   conversion_uploads outbox inside the same request that moved the lead, then
   a sender drains the outbox. Uploading inline would mean a Google outage, an
   expired token, or a slow response either blocks the dashboard or silently
   loses the conversion. With the outbox the row survives, the dashboard shows
   it as failed, and it can be retried.

   Value telling Smart Bidding what each stage is worth is the point of the
   exercise: a customer must outweigh a raw lead or the bidding cannot learn. */

export type ConversionStage = LeadStatus;

export type StageConfig = {
  stage: ConversionStage;
  conversionActionId: string;
  value: number;
};

export type UploadRow = {
  id: number;
  leadId: number;
  stage: ConversionStage;
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

/* A stage is only reported when it has a conversion action id. Leaving one
   unset is the supported way to opt a stage out, which matters for 'lead':
   most setups already count the form submit with the gtag snippet in the
   browser, and reporting it here too would count it twice. */
export function stageConfig(stage: ConversionStage): StageConfig | null {
  const conversionActionId = (process.env[ENV_ACTION[stage]] ?? "").trim();
  if (!conversionActionId) return null;

  const raw = process.env[ENV_VALUE[stage]];
  const parsed = raw === undefined ? Number.NaN : Number(raw);
  const value = Number.isFinite(parsed) && parsed >= 0 ? parsed : DEFAULT_VALUES[stage];

  return { stage, conversionActionId, value };
}

export function configuredStages(): StageConfig[] {
  return LEAD_STATUSES.map(stageConfig).filter((s): s is StageConfig => s !== null);
}

/* ==========================================================================
   Enqueue
   ========================================================================== */

/* One row per lead and stage, forever. Demoting a lead and promoting it again
   re-enters the same key, and ON CONFLICT DO NOTHING makes that a no-op rather
   than a second conversion for the same milestone. */
const dedupeKey = (leadId: number, stage: ConversionStage) => `${leadId}:${stage}`;

export async function enqueueConversion(
  leadId: number,
  stage: ConversionStage,
  occurredAt: Date = new Date(),
): Promise<boolean> {
  const config = stageConfig(stage);
  if (!config) return false;

  const rows = await q<{ id: number }>(
    `INSERT INTO conversion_uploads (lead_id, stage, dedupe_key, value, currency, occurred_at)
     VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT (dedupe_key) DO NOTHING
     RETURNING id`,
    [leadId, stage, dedupeKey(leadId, stage), config.value, currency(), occurredAt],
  );
  return rows.length > 0;
}

/* Promotions can skip steps: dragging a lead straight to customer still passed
   through mql and sql in business terms, and Google needs each milestone to
   learn the funnel. Backfilling the intermediate stages keeps the reported
   funnel consistent with the dashboard's own "reached" counts. */
export async function enqueueStageAndBackfill(
  leadId: number,
  stage: ConversionStage,
  occurredAt: Date = new Date(),
): Promise<number> {
  const target = LEAD_STATUSES.indexOf(stage);
  if (target < 0) return 0;

  let queued = 0;
  for (let i = 0; i <= target; i += 1) {
    if (await enqueueConversion(leadId, LEAD_STATUSES[i], occurredAt)) queued += 1;
  }
  return queued;
}

/* ==========================================================================
   Send
   ========================================================================== */

const MAX_ATTEMPTS = 5;

/* How long a claimed row may sit in 'sending' before another sender may take
   it. Long enough that a slow Google response is never stolen mid flight,
   short enough that a killed process does not strand a conversion. */
const STALE_CLAIM_SECONDS = 300;

type PendingJob = {
  id: number;
  leadId: number;
  stage: ConversionStage;
  value: string;
  currency: string;
  occurredAt: string;
  attempts: number;
  email: string;
  phone: string;
  gclid: string;
  gbraid: string;
  wbraid: string;
  isDemo: boolean;
};

export type DrainResult = {
  processed: number;
  sent: number;
  failed: number;
  skipped: number;
  reason?: string;
};

export async function drainConversions(limit = 25): Promise<DrainResult> {
  const empty: DrainResult = { processed: 0, sent: 0, failed: 0, skipped: 0 };

  if (!isConfigured()) {
    return { ...empty, reason: "Google Ads credentials are not configured." };
  }
  const config = readConfig();
  if (!config.ok) return { ...empty, reason: `Missing ${config.missing.join(", ")}.` };

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
         AND (
           status IN ('pending', 'failed')
           OR (status = 'sending' AND claimed_at < now() - make_interval(secs => $3))
         )
       ORDER BY created_at ASC
       LIMIT $1
       FOR UPDATE SKIP LOCKED
     )
     RETURNING id`,
    [limit, MAX_ATTEMPTS, STALE_CLAIM_SECONDS],
  );

  if (claimed.length === 0) return { ...empty };

  const jobs = await q<PendingJob>(
    `SELECT c.id,
            c.lead_id  AS "leadId",
            c.stage,
            c.value,
            c.currency,
            c.occurred_at AS "occurredAt",
            c.attempts,
            l.email,
            l.phone,
            l.gclid,
            l.gbraid,
            l.wbraid,
            l.is_demo  AS "isDemo"
     FROM conversion_uploads c
     JOIN leads l ON l.id = c.lead_id
     WHERE c.id = ANY($1::int[])
     ORDER BY c.created_at ASC`,
    [claimed.map((row) => row.id)],
  );

  const result: DrainResult = { ...empty, processed: jobs.length };

  for (const job of jobs) {
    /* Seeded demo rows exist to make the dashboard look alive. Sending them
       would teach Smart Bidding on fiction. */
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

    const action = stageConfig(job.stage);
    if (!action) {
      await q(
        `UPDATE conversion_uploads
         SET status = 'skipped', last_error = $2
         WHERE id = $1`,
        [job.id, `No conversion action configured for stage "${job.stage}".`],
      );
      result.skipped += 1;
      continue;
    }

    try {
      const outcome = await ingestEvent(
        config.config,
        {
          conversionActionId: action.conversionActionId,
          transactionId: dedupeKey(job.leadId, job.stage),
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
      const permanent = error instanceof GoogleAdsError && !error.retryable;
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
        `[conversions] lead ${job.leadId} stage ${job.stage} attempt ${attempts}: ${message}`,
      );
    }
  }

  return result;
}

/* ==========================================================================
   Read side
   ========================================================================== */

export async function getUploadsForSource(source: string): Promise<UploadRow[]> {
  return q<UploadRow>(
    `SELECT c.id,
            c.lead_id AS "leadId",
            c.stage,
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
