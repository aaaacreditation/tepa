import "server-only";
import { after } from "next/server";
import { channelOf, type Channel } from "./channels";
import { q } from "./db";
import { SOURCES } from "./sources";

/* Every lead is copied into AAA's Odoo CRM (aaa-acc1.odoo.com) as an
   opportunity, so sales works one pipeline instead of retyping the dashboard.

   The portal's only job is to create the record with the right tags. Odoo
   sends every email: its Marketing Automation campaigns start on the
   "Nurture: …" tags, and their opened / clicked / replied branching only works
   on mail Odoo sent itself. Nothing here emails a lead.

   Same shape as the conversion outbox in lib/conversions.ts: the enquiry route
   writes an odoo_sync row next to the lead, sends it after the response, and
   the ten minute drain timer on the server retries whatever Odoo refused. An
   Odoo outage costs a delay, never a lead.

   Talks to Odoo 19's JSON-2 API: POST /json/2/<model>/<method> with the API
   key as a bearer token and the database in a header. Nothing else is needed;
   the key's owner is the user every record is created as. */

/* ==========================================================================
   Configuration
   ========================================================================== */

/* Which new leads get the Nurture tag, and so the welcome email sequence.
   "off" until the campaigns in Odoo are running: a tag added while they sit in
   draft would start the sequence days late, the moment someone presses Start. */
export type NurtureRule = "off" | "all" | "email";

export type OdooConfig = {
  url: string;
  db: string;
  apiKey: string;
};

export function readOdooConfig():
  | { ok: true; config: OdooConfig }
  | { ok: false; missing: string[] } {
  const url = (process.env.ODOO_URL ?? "").trim().replace(/\/+$/, "");
  const db = (process.env.ODOO_DB ?? "").trim();
  const apiKey = (process.env.ODOO_API_KEY ?? "").trim();

  const missing = [
    ...(url ? [] : ["ODOO_URL"]),
    ...(db ? [] : ["ODOO_DB"]),
    ...(apiKey ? [] : ["ODOO_API_KEY"]),
  ];
  if (missing.length > 0) return { ok: false, missing };

  return { ok: true, config: { url, db, apiKey } };
}

/* The kill switch. While ODOO_SYNC_PAUSED=1 leads keep being queued, but
   nothing is sent to Odoo; clearing it drains the queue in order. For going
   live in steps, and for stopping the sync the moment it misbehaves without a
   deploy. The preview still works while paused. */
export function odooSyncPaused(): boolean {
  return ["1", "true", "yes"].includes((process.env.ODOO_SYNC_PAUSED ?? "").trim().toLowerCase());
}

export function nurtureRule(): NurtureRule {
  const value = (process.env.ODOO_NURTURE ?? "").trim().toLowerCase();
  return value === "all" || value === "email" ? value : "off";
}

/* The record's page in Odoo, for the dashboard to link to. Empty when Odoo is
   not configured or the lead has not been synced yet. */
export function odooRecordUrl(odooLeadId: number): string {
  const url = (process.env.ODOO_URL ?? "").trim().replace(/\/+$/, "");
  return url && odooLeadId > 0 ? `${url}/odoo/crm.lead/${odooLeadId}` : "";
}

/* ==========================================================================
   Mapping
   ========================================================================== */

/* Tag names as they exist in Odoo. Looked up by name rather than id so a tag
   recreated by hand keeps working; the nurture names are what the two
   Marketing Automation campaigns filter on. */
const PRODUCT_TAG: Record<string, string> = {
  tepa: "TEPA",
  healthcare: "Healthcare Accreditation",
  clinic: "Healthcare Accreditation",
};

const NURTURE_TAG: Record<string, string> = {
  tepa: "Nurture: TEPA",
  healthcare: "Nurture: Healthcare",
  clinic: "Nurture: Healthcare",
};

/* The medium sales already picks by hand for each ad platform. Google's is
   the older "Google Adwords", not the unused "Google Ads" beside it. */
const MEDIUM: Record<Channel, string> = {
  google: "Google Adwords",
  meta: "Facebook",
  other: "Website",
};

/* Who owns a new opportunity, as AAA's sales team splits the work (2 Oct
   2026): Sara Morgan every healthcare and clinic lead; on TEPA, Adam Malom the
   United States and Babita Singh India and the Middle East. Any other TEPA
   country is left unassigned. That is safe because every Odoo user is a CRM
   administrator and sees unassigned records, and it beats Odoo's default,
   which would hand them all to the API key's owner. The country is the one
   the visitor picked on the form. Ids are Odoo res.users. */
const ADAM_MALOM = 7;
const BABITA_SINGH = 9;
const SARA_MORGAN = 17;

/* The Gulf, the Levant, Iraq, Yemen, Iran and Egypt — Egypt because the
   ME/GCC ad campaign targets it. North Africa west of Egypt and Turkey are
   not included. */
const MIDDLE_EAST = new Set([
  "AE", "SA", "QA", "KW", "BH", "OM", "YE",
  "IQ", "JO", "LB", "SY", "PS", "IR", "EG",
]);

function ownerFor(lead: { source: string; countryCode: string }): number | false {
  if (lead.source === "healthcare" || lead.source === "clinic") return SARA_MORGAN;
  if (lead.source === "tepa") {
    const country = lead.countryCode.toUpperCase();
    if (country === "US") return ADAM_MALOM;
    if (country === "IN" || MIDDLE_EAST.has(country)) return BABITA_SINGH;
  }
  return false;
}

export const CONTACT_METHODS = ["WhatsApp", "Phone call", "Email"] as const;
export type ContactMethod = (typeof CONTACT_METHODS)[number];

/* The channel the visitor asked to be contacted on. /healthcare and the Fast
   Track page write it into the message as "Preferred contact: …"; /tepa and
   /clinic do not ask, so their leads have none. Read from the message rather
   than a column so leads from before the sync are classified the same way. */
export function contactMethodOf(message: string): ContactMethod | "" {
  const match = /Preferred contact:\s*(WhatsApp|Phone call|Email)\b/.exec(message);
  return match ? (match[1] as ContactMethod) : "";
}

/* Tagged per channel so the campaigns can branch on it — the welcome email to
   someone who asked for WhatsApp should say so — and so sales sees it on the
   card without opening the description. Created in Odoo on first use. */
function contactTag(method: ContactMethod): string {
  return `Contact: ${method}`;
}

export function nurtureForEnquiry(message: string): boolean {
  const rule = nurtureRule();
  if (rule === "all") return true;
  if (rule === "email") return contactMethodOf(message) === "Email";
  return false;
}

/* ==========================================================================
   JSON-2 client
   ========================================================================== */

export class OdooError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly retryable: boolean,
  ) {
    super(message);
    this.name = "OdooError";
  }
}

/* Exceptions Odoo raises for a request that will fail the same way however
   often it is sent. Everything else — a 5xx, a timeout, a dropped connection,
   a bad key someone is about to fix — is worth another attempt. */
const PERMANENT_ERRORS = new Set([
  "odoo.exceptions.ValidationError",
  "odoo.exceptions.UserError",
  "odoo.exceptions.AccessError",
  "odoo.exceptions.MissingError",
  "builtins.ValueError",
  "builtins.TypeError",
  "builtins.KeyError",
]);

const REQUEST_TIMEOUT_MS = 20_000;

/* Odoo Online answers a burst of requests with 429 "Rate limit exceeded" —
   seven lookups fired at once were enough. Calls are made one at a time, and
   a 429 waits and tries again a few times before giving the row back to the
   outbox. */
const RATE_LIMIT_RETRIES = 3;
const RATE_LIMIT_WAIT_MS = 2_000;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function odooCall<T>(
  config: OdooConfig,
  model: string,
  method: string,
  body: Record<string, unknown>,
): Promise<T> {
  let response: Response;
  for (let attempt = 0; ; attempt += 1) {
    try {
      response = await fetch(`${config.url}/json/2/${model}/${method}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `bearer ${config.apiKey}`,
          "X-Odoo-Database": config.db,
        },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
        cache: "no-store",
      });
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      throw new OdooError(`${model}.${method}: ${reason}`, 0, true);
    }
    if (response.status !== 429 || attempt >= RATE_LIMIT_RETRIES) break;

    const retryAfter = Number(response.headers.get("retry-after"));
    await response.body?.cancel();
    await sleep(
      Number.isFinite(retryAfter) && retryAfter > 0
        ? Math.min(retryAfter, 30) * 1000
        : RATE_LIMIT_WAIT_MS * (attempt + 1),
    );
  }

  const text = await response.text();
  if (!response.ok) {
    let name = "";
    let message = text.slice(0, 300);
    try {
      const parsed = JSON.parse(text) as { name?: string; message?: string };
      name = parsed.name ?? "";
      message = parsed.message ?? message;
    } catch {
      /* Not JSON: a proxy error page. The raw text above is what we have. */
    }
    throw new OdooError(
      `${model}.${method} ${response.status} ${name}: ${message}`.slice(0, 500),
      response.status,
      !PERMANENT_ERRORS.has(name),
    );
  }

  return JSON.parse(text) as T;
}

/* Ids of tags, stages, mediums and countries barely change, so each is looked
   up once an hour rather than on every lead. */
const LOOKUP_TTL_MS = 60 * 60 * 1000;
const lookups = new Map<string, { id: number | null; at: number }>();

async function lookupId(
  config: OdooConfig,
  model: string,
  domain: unknown[],
  order?: string,
): Promise<number | null> {
  const key = `${model}:${JSON.stringify(domain)}`;
  const hit = lookups.get(key);
  if (hit && Date.now() - hit.at < LOOKUP_TTL_MS) return hit.id;

  const rows = await odooCall<{ id: number }[]>(config, model, "search_read", {
    domain,
    fields: ["id"],
    limit: 1,
    ...(order ? { order } : {}),
  });
  const id = rows[0]?.id ?? null;
  lookups.set(key, { id, at: Date.now() });
  return id;
}

async function tagId(config: OdooConfig, name: string, create: boolean): Promise<number | null> {
  const domain = [["name", "=", name]];
  const id = await lookupId(config, "crm.tag", domain);
  if (id || !create) return id;

  const [created] = await odooCall<number[]>(config, "crm.tag", "create", {
    vals_list: [{ name }],
  });
  lookups.set(`crm.tag:${JSON.stringify(domain)}`, { id: created, at: Date.now() });
  return created;
}

/* ==========================================================================
   Planning one lead
   ========================================================================== */

type SyncOrigin = "enquiry" | "backfill";

/* One lead as the sync reads it. */
type SyncLead = {
  leadId: number;
  origin: SyncOrigin;
  nurture: boolean;
  source: string;
  fullName: string;
  organization: string;
  position: string;
  email: string;
  phone: string;
  countryCode: string;
  website: string;
  message: string;
  createdAt: string;
  gclid: string;
  gbraid: string;
  wbraid: string;
  fbclid: string;
  utmSource: string;
  utmCampaign: string;
  utmTerm: string;
  landingPath: string;
};

export type OdooPlan =
  /* The person is already in Odoo: remember which record, and on a fresh
     enquiry leave a note on it rather than opening a duplicate. */
  | { action: "link"; odooLeadId: number; note: string; reason: string }
  | { action: "create"; vals: Record<string, unknown>; warnings: string[] };

/* Written into every record this sync creates. If the process dies between
   Odoo creating the record and the id being stored here, the next attempt
   finds its own record by this rather than creating a second one. The closing
   parenthesis stops lead 12 matching lead 123. */
function markerFor(leadId: number): string {
  return `portal lead #${leadId})`;
}

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

function pageLabel(lead: SyncLead): string {
  if (lead.landingPath.startsWith("/trainingandeducation")) return "Fast Track page";
  return SOURCES[lead.source]?.path ?? lead.source;
}

function stamp(iso: string): string {
  return `${iso.slice(0, 16).replace("T", " ")} UTC`;
}

function adLine(lead: SyncLead): string {
  const channel = channelOf(lead);
  const parts = [
    channel === "google" ? "Google Ads" : channel === "meta" ? "Meta" : "No ad click",
    lead.utmCampaign && `campaign: ${lead.utmCampaign}`,
    lead.utmTerm && `keyword: ${lead.utmTerm}`,
  ].filter(Boolean);
  return parts.join(" · ");
}

function descriptionHtml(lead: SyncLead): string {
  const answers = lead.message
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map(escapeHtml)
    .join("<br>");
  const dashboard = `https://campaigns.aaa-accreditation.org/dashboard/${encodeURIComponent(lead.source)}`;

  return [
    `<p><strong>Enquiry from the AAA landing pages</strong>: ${escapeHtml(pageLabel(lead))}, ` +
      `${stamp(lead.createdAt)} (${markerFor(lead.leadId)}</p>`,
    answers && `<p>${answers}</p>`,
    `<p>${escapeHtml(adLine(lead))}</p>`,
    `<p>Pipeline stage and ad reporting: <a href="${dashboard}">${dashboard}</a></p>`,
  ]
    .filter(Boolean)
    .join("");
}

function resubmissionNote(lead: SyncLead): string {
  const method = contactMethodOf(lead.message);
  const answers = lead.message
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map(escapeHtml)
    .join("<br>");
  return [
    `<p>Submitted the ${escapeHtml(pageLabel(lead))} form again on ${stamp(lead.createdAt)} ` +
      `(${markerFor(lead.leadId)}. No new opportunity was opened.</p>`,
    method && `<p>Preferred contact: ${escapeHtml(method)}</p>`,
    answers && `<p>${answers}</p>`,
    `<p>${escapeHtml(adLine(lead))}</p>`,
  ]
    .filter(Boolean)
    .join("");
}

/* readOnly is the preview: a contact tag missing in Odoo is reported instead
   of created, so planning never writes anything. */
export async function planLead(
  config: OdooConfig,
  lead: SyncLead,
  readOnly = false,
): Promise<OdooPlan> {
  /* Our own record from an attempt that never got to store its id. */
  const own = await odooCall<{ id: number }[]>(config, "crm.lead", "search_read", {
    domain: [
      ["description", "ilike", markerFor(lead.leadId)],
      ["active", "in", [true, false]],
    ],
    fields: ["id"],
    limit: 1,
  });
  if (own[0]) {
    return { action: "link", odooLeadId: own[0].id, note: "", reason: "created earlier" };
  }

  /* The same person, matched on the email Odoo normalises. The backfill also
     counts archived (lost) records, because those leads were entered by hand
     already and copying them again would only duplicate history. A fresh
     enquiry from someone whose only record was lost starts a new one. */
  const email = lead.email.trim().toLowerCase();
  const existing = await odooCall<{ id: number }[]>(config, "crm.lead", "search_read", {
    domain:
      lead.origin === "backfill"
        ? [
            ["email_normalized", "=", email],
            ["active", "in", [true, false]],
          ]
        : [["email_normalized", "=", email]],
    fields: ["id"],
    order: "active desc, id desc",
    limit: 1,
  });
  if (existing[0]) {
    return {
      action: "link",
      odooLeadId: existing[0].id,
      note: lead.origin === "enquiry" ? resubmissionNote(lead) : "",
      reason: "email already in Odoo",
    };
  }

  const warnings: string[] = [];
  const method = contactMethodOf(lead.message);
  const productTag = PRODUCT_TAG[lead.source];
  const nurtureTag = lead.nurture ? NURTURE_TAG[lead.source] : undefined;

  /* In sequence, not Promise.all: see RATE_LIMIT_RETRIES. After the first lead
     these all come from the cache anyway. */
  const stage = await lookupId(config, "crm.stage", [["name", "=", "New"]], "sequence asc");
  const team = await lookupId(config, "crm.team", [["name", "=", "Sales"]]);
  const medium = await lookupId(config, "utm.medium", [["name", "=", MEDIUM[channelOf(lead)]]]);
  const country = lead.countryCode
    ? await lookupId(config, "res.country", [["code", "=", lead.countryCode.toUpperCase()]])
    : null;
  const product = productTag ? await tagId(config, productTag, false) : null;
  const nurture = nurtureTag ? await tagId(config, nurtureTag, false) : null;
  const contact = method ? await tagId(config, contactTag(method), !readOnly) : null;

  if (method && !contact) warnings.push(`Tag "${contactTag(method)}" will be created in Odoo.`);
  /* A missing nurture tag means no welcome email, so it is recorded on the
     outbox row where the dashboard shows it, not only logged. */
  if (productTag && !product) warnings.push(`Tag "${productTag}" not found in Odoo.`);
  if (nurtureTag && !nurture) warnings.push(`Tag "${nurtureTag}" not found in Odoo; no nurture.`);
  if (!stage) warnings.push('Stage "New" not found in Odoo.');

  const tags = [product, nurture, contact].filter((id): id is number => id !== null);

  const vals: Record<string, unknown> = {
    type: "opportunity",
    /* Sales names opportunities after the organisation. */
    name: lead.organization || lead.fullName,
    contact_name: lead.fullName,
    partner_name: lead.organization,
    email_from: lead.email,
    phone: lead.phone,
    function: lead.position,
    website: lead.website,
    user_id: ownerFor(lead),
    tag_ids: [[6, 0, tags]],
    description: descriptionHtml(lead),
    ...(stage ? { stage_id: stage } : {}),
    ...(team ? { team_id: team } : {}),
    ...(medium ? { medium_id: medium } : {}),
    ...(country ? { country_id: country } : {}),
  };

  return { action: "create", vals, warnings };
}

/* ==========================================================================
   Outbox
   ========================================================================== */

export async function enqueueOdooSync(
  leadId: number,
  options: { origin: SyncOrigin; nurture: boolean },
): Promise<boolean> {
  const rows = await q<{ id: number }>(
    `INSERT INTO odoo_sync (lead_id, origin, nurture)
     VALUES ($1, $2, $3)
     ON CONFLICT (lead_id) DO NOTHING
     RETURNING id`,
    [leadId, options.origin, options.nurture],
  );
  return rows.length > 0;
}

/* Called by every enquiry route once the lead is stored. Never throws: the
   lead is already saved, and a CRM problem must not turn into a 502 that tells
   the visitor their enquiry failed. The drain timer picks up anything left. */
export async function queueEnquiryForOdoo(leadId: number, message: string): Promise<void> {
  try {
    const queued = await enqueueOdooSync(leadId, {
      origin: "enquiry",
      nurture: nurtureForEnquiry(message),
    });
    if (!queued || !readOdooConfig().ok || odooSyncPaused()) return;

    after(async () => {
      try {
        await drainOdoo(5);
      } catch (error) {
        console.error("[odoo] sync after enquiry failed", error);
      }
    });
  } catch (error) {
    console.error(`[odoo] could not queue lead ${leadId}`, error);
  }
}

/* A lead that has not reached Odoo after this many tries needs a person: the
   row turns 'failed' and the dashboard says so. Twelve attempts on the ten
   minute timer is about two hours of Odoo being unreachable. */
const MAX_ATTEMPTS = 12;

/* As in lib/conversions.ts: a row claimed by a sender that was killed mid
   flight is handed back after this long. */
const STALE_CLAIM_SECONDS = 300;

const SYNC_LEAD_COLUMNS = `
  s.id,
  s.lead_id      AS "leadId",
  s.origin,
  s.nurture,
  s.attempts,
  l.source,
  l.full_name    AS "fullName",
  l.organization,
  l.contact_role AS "position",
  l.email,
  l.phone,
  l.country_code AS "countryCode",
  l.website,
  l.message,
  l.is_demo      AS "isDemo",
  to_char(l.created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS "createdAt",
  l.gclid,
  l.gbraid,
  l.wbraid,
  l.fbclid,
  l.utm_source   AS "utmSource",
  l.utm_campaign AS "utmCampaign",
  l.utm_term     AS "utmTerm",
  l.landing_path AS "landingPath"
`;

type SyncJob = SyncLead & { id: number; attempts: number; isDemo: boolean };

export type OdooDrainResult = {
  processed: number;
  created: number;
  linked: number;
  failed: number;
  skipped: number;
  reason?: string;
};

export async function drainOdoo(limit = 25): Promise<OdooDrainResult> {
  const empty: OdooDrainResult = { processed: 0, created: 0, linked: 0, failed: 0, skipped: 0 };

  const read = readOdooConfig();
  if (!read.ok) return { ...empty, reason: `Odoo is not configured. Missing ${read.missing.join(", ")}.` };
  if (odooSyncPaused()) return { ...empty, reason: "ODOO_SYNC_PAUSED is set; leads wait in the queue." };
  const config = read.config;

  /* One atomic UPDATE reserves the rows, so the after() sender and the timer
     cannot both create the same opportunity; see drainConversions. */
  const claimed = await q<{ id: number }>(
    `UPDATE odoo_sync
     SET status = 'sending', attempts = attempts + 1, claimed_at = now()
     WHERE id IN (
       SELECT id FROM odoo_sync
       WHERE attempts < $2
         AND (
           status = 'pending'
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

  const jobs = await q<SyncJob>(
    `SELECT ${SYNC_LEAD_COLUMNS}
     FROM odoo_sync s
     JOIN leads l ON l.id = s.lead_id
     WHERE s.id = ANY($1::int[])
     ORDER BY s.created_at ASC`,
    [claimed.map((row) => row.id)],
  );

  const result: OdooDrainResult = { ...empty, processed: jobs.length };

  /* One at a time on purpose: two enquiries from the same person in one batch
     must see each other, or both would open an opportunity. */
  for (const job of jobs) {
    if (job.isDemo) {
      await q(
        `UPDATE odoo_sync SET status = 'skipped', last_error = 'Demo lead, not synced.' WHERE id = $1`,
        [job.id],
      );
      result.skipped += 1;
      continue;
    }

    try {
      const plan = await planLead(config, job);
      let odooLeadId: number;
      let outcome: "created" | "linked" | "noted";
      let warnings = "";

      if (plan.action === "create") {
        [odooLeadId] = await odooCall<number[]>(config, "crm.lead", "create", {
          vals_list: [plan.vals],
        });
        outcome = "created";
        warnings = plan.warnings.join(" ");
        result.created += 1;
      } else {
        odooLeadId = plan.odooLeadId;
        outcome = "linked";
        if (plan.note) {
          await odooCall(config, "crm.lead", "message_post", {
            ids: [odooLeadId],
            body: plan.note,
            body_is_html: true,
            message_type: "comment",
            subtype_xmlid: "mail.mt_note",
          });
          outcome = "noted";
        }
        result.linked += 1;
      }

      await q(
        `UPDATE odoo_sync
         SET status = 'sent', synced_at = now(), odoo_lead_id = $2, outcome = $3, last_error = $4
         WHERE id = $1`,
        [job.id, odooLeadId, outcome, warnings],
      );
      await q("UPDATE leads SET odoo_lead_id = $2 WHERE id = $1", [job.leadId, odooLeadId]);
      if (warnings) console.warn(`[odoo] lead ${job.leadId}: ${warnings}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const permanent = error instanceof OdooError && !error.retryable;
      const nextStatus = permanent || job.attempts >= MAX_ATTEMPTS ? "failed" : "pending";

      await q(`UPDATE odoo_sync SET status = $2, last_error = $3 WHERE id = $1`, [
        job.id,
        nextStatus,
        message,
      ]);
      result.failed += 1;
      console.error(`[odoo] lead ${job.leadId} attempt ${job.attempts}: ${message}`);
    }
  }

  return result;
}

/* What the drain would send for one lead, without sending it. Reads Odoo,
   writes nothing anywhere: backs the preview endpoint used to check a mapping
   before it goes live. */
export async function previewLead(
  leadId: number,
  options: { origin?: SyncOrigin; nurture?: boolean } = {},
): Promise<OdooPlan | { error: string }> {
  const read = readOdooConfig();
  if (!read.ok) return { error: `Odoo is not configured. Missing ${read.missing.join(", ")}.` };

  const rows = await q<SyncLead>(
    `SELECT ${SYNC_LEAD_COLUMNS}
     FROM leads l
     LEFT JOIN odoo_sync s ON s.lead_id = l.id
     WHERE l.id = $1`,
    [leadId],
  );
  const row = rows[0];
  if (!row) return { error: `No lead ${leadId}.` };

  return planLead(
    read.config,
    {
      ...row,
      leadId,
      origin: options.origin ?? row.origin ?? "enquiry",
      nurture: options.nurture ?? row.nurture ?? nurtureForEnquiry(row.message),
    },
    true,
  );
}
