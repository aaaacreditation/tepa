import "server-only";
import type { Attribution } from "./attribution";
import {
  CHANNEL_SQL,
  type Channel,
  type ChannelFilter,
  channelClause,
} from "./channels";
import { q } from "./db";
import {
  LEAD_STATUSES,
  NOT_QUALIFIED,
  type LeadStatus,
  type PipelineStage,
} from "./lead-status";

export { isLeadStatus, LEAD_STATUSES, STATUS_LABEL, type LeadStatus } from "./lead-status";

export type LeadRow = {
  id: number;
  source: string;
  fullName: string;
  organization: string;
  /* The visitor's job title as they typed it (CEO, Quality Manager…). Read
     from the contact_role column; empty on leads from before the field. */
  position: string;
  email: string;
  countryCode: string;
  countryName: string;
  phone: string;
  website: string;
  message: string;
  status: LeadStatus;
  /* Why the lead was marked not qualified. Empty for every other status. */
  disqualifiedReason: string;
  notes: string;
  isDemo: boolean;
  createdAt: string;
  statusChangedAt: string;
  gclid: string;
  gbraid: string;
  wbraid: string;
  fbclid: string;
  utmSource: string;
  utmMedium: string;
  utmCampaign: string;
  utmTerm: string;
  utmContent: string;
};

export type LeadEventRow = {
  id: number;
  leadId: number;
  fromStatus: LeadStatus;
  toStatus: LeadStatus;
  changedBy: string;
  reason: string;
  createdAt: string;
};

export type NewLead = {
  source: string;
  fullName: string;
  organization: string;
  position: string;
  email: string;
  countryCode: string;
  countryName: string;
  phone: string;
  website: string;
  message: string;
  attribution: Attribution;
  /* Read off the enquiry request for Meta; see lib/db.ts. */
  fbp: string;
  fbc: string;
  clientIp: string;
  clientUserAgent: string;
};

const LEAD_COLUMNS = `
  id,
  source,
  full_name          AS "fullName",
  organization,
  contact_role       AS "position",
  email,
  country_code       AS "countryCode",
  country_name       AS "countryName",
  phone,
  website,
  message,
  status,
  disqualified_reason AS "disqualifiedReason",
  notes,
  is_demo            AS "isDemo",
  to_char(created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"')        AS "createdAt",
  to_char(status_changed_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS "statusChangedAt",
  gclid,
  gbraid,
  wbraid,
  fbclid,
  utm_source   AS "utmSource",
  utm_medium   AS "utmMedium",
  utm_campaign AS "utmCampaign",
  utm_term     AS "utmTerm",
  utm_content  AS "utmContent"
`;

export async function insertLead(lead: NewLead): Promise<number> {
  const a = lead.attribution;
  const rows = await q<{ id: number }>(
    `INSERT INTO leads
       (source, full_name, organization, email, country_code, country_name, phone, website, message,
        gclid, gbraid, wbraid,
        utm_source, utm_medium, utm_campaign, utm_term, utm_content,
        landing_path, referrer, clicked_at,
        fbclid, fbp, fbc, client_ip, client_user_agent,
        contact_role)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9,
             $10, $11, $12,
             $13, $14, $15, $16, $17,
             $18, $19, $20,
             $21, $22, $23, $24, $25,
             $26)
     RETURNING id`,
    [
      lead.source,
      lead.fullName,
      lead.organization,
      lead.email,
      lead.countryCode,
      lead.countryName,
      lead.phone,
      lead.website,
      lead.message,
      a.gclid,
      a.gbraid,
      a.wbraid,
      a.utmSource,
      a.utmMedium,
      a.utmCampaign,
      a.utmTerm,
      a.utmContent,
      a.landingPath,
      a.referrer,
      a.clickedAt || null,
      a.fbclid,
      lead.fbp,
      lead.fbc,
      lead.clientIp,
      lead.clientUserAgent,
      lead.position,
    ],
  );
  return rows[0].id;
}

/* Returns true when the stage actually moved, so the caller can report the
   transition onward without re-reading the row or firing on a no-op.

   The reason belongs to a disqualification and is dropped for anything else,
   so re-qualifying a lead clears the row's reason rather than leaving a stale
   sentence attached to a live opportunity. The event keeps its copy either
   way, which is what the history panel reads. */
export async function updateLeadStatus(
  id: number,
  status: LeadStatus,
  changedBy: string,
  reason = "",
): Promise<boolean> {
  const current = await q<{ status: LeadStatus }>(
    "SELECT status FROM leads WHERE id = $1",
    [id],
  );
  if (current.length === 0 || current[0].status === status) return false;

  const disqualifying = status === NOT_QUALIFIED;

  await q(
    `UPDATE leads
     SET status = $2, status_changed_at = now(), disqualified_reason = $3
     WHERE id = $1`,
    [id, status, disqualifying ? reason : ""],
  );
  await q(
    `INSERT INTO lead_events (lead_id, from_status, to_status, changed_by, reason)
     VALUES ($1, $2, $3, $4, $5)`,
    [id, current[0].status, status, changedBy, disqualifying ? reason : ""],
  );
  return true;
}

/* Correcting the reason on a lead already marked not qualified. Deliberately
   not a status change: nothing moved, so there is no new event and nothing to
   report onward — only the sentence attached to the row. */
export async function saveDisqualifiedReason(id: number, reason: string): Promise<boolean> {
  const rows = await q<{ id: number }>(
    `UPDATE leads SET disqualified_reason = $2
     WHERE id = $1 AND status = $3
     RETURNING id`,
    [id, reason, NOT_QUALIFIED],
  );
  return rows.length > 0;
}

export async function saveLeadNotes(id: number, notes: string): Promise<void> {
  await q("UPDATE leads SET notes = $2 WHERE id = $1", [id, notes]);
}

export async function deleteLead(id: number): Promise<void> {
  await q("DELETE FROM leads WHERE id = $1", [id]);
}

/* ==========================================================================
   Dashboard queries. Everything is scoped to one landing page source and an
   optional trailing window so filters keep every number in agreement.
   ========================================================================== */

export type DailyPoint = { date: string; count: number };
export type CountryCount = { countryName: string; count: number };

/* Where every lead in the range currently sits, disqualifications included. */
export type StatusCounts = Record<LeadStatus, number>;

/* How far down the pipeline leads got. Only the four stages have a "reached"
   reading; not qualified is an exit, not a depth. */
export type FunnelCounts = Record<PipelineStage, number>;

export type ChannelCounts = Record<Channel, number>;

export type DashboardData = {
  leads: LeadRow[];
  events: LeadEventRow[];
  daily: DailyPoint[];
  countries: CountryCount[];
  /* Leads whose current status is each of the five. */
  pipeline: StatusCounts;
  /* Leads that reached at least each stage (funnel view). */
  reached: FunnelCounts;
  /* Leads per ad platform, always across the whole range: the tab strip has to
     show what the other tabs hold, so this one ignores the channel filter. */
  channels: ChannelCounts;
  total: number;
  previousTotal: number | null;
};

/* An inclusive window of whole UTC days, 'YYYY-MM-DD'. A null bound is
   unbounded on that side, which is how "all time" is expressed. Whole days
   rather than a rolling count of hours because that is what the dashboard
   asks about: "today" has to mean today, not the last 24 hours, and a custom
   range has to include every lead that arrived on its last day.

   The bounds are always passed as parameters, even when null, so every query
   below takes the same three and the SQL never has to be assembled by hand. */
export type DateWindow = { start: string | null; end: string | null };

export const WHOLE_TIME: DateWindow = { start: null, end: null };

/* `end` is inclusive, so the upper guard runs to the start of the next day. */
const IN_WINDOW = `AND ($2::date IS NULL OR created_at >= $2::date)
       AND ($3::date IS NULL OR created_at < $3::date + interval '1 day')`;

/* The window immediately before this one, of the same length, for the "vs
   previous" delta. An unbounded window has no previous to compare with. */
export function previousWindow(window: DateWindow): DateWindow | null {
  if (!window.start || !window.end) return null;
  const start = Date.parse(`${window.start}T00:00:00Z`);
  const end = Date.parse(`${window.end}T00:00:00Z`);
  if (Number.isNaN(start) || Number.isNaN(end) || end < start) return null;

  const DAY = 86_400_000;
  const days = Math.round((end - start) / DAY) + 1;
  const iso = (ms: number) => new Date(ms).toISOString().slice(0, 10);
  return { start: iso(start - days * DAY), end: iso(start - DAY) };
}

export async function getDashboardData(
  source: string,
  window: DateWindow,
  channel: ChannelFilter = "all",
): Promise<DashboardData> {
  const inChannel = channelClause(channel);
  const bounds: [string, string | null, string | null] = [source, window.start, window.end];

  const leadsQ = q<LeadRow>(
    `SELECT ${LEAD_COLUMNS} FROM leads
     WHERE source = $1 ${IN_WINDOW} ${inChannel}
     ORDER BY created_at DESC
     LIMIT 1000`,
    bounds,
  );

  /* History is read for the leads on screen, so it is scoped to the page but
     not to the range or the channel: an event older than the window still
     belongs to a lead inside it. */
  const eventsQ = q<LeadEventRow>(
    `SELECT e.id,
            e.lead_id     AS "leadId",
            e.from_status AS "fromStatus",
            e.to_status   AS "toStatus",
            e.changed_by  AS "changedBy",
            e.reason,
            to_char(e.created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS "createdAt"
     FROM lead_events e
     JOIN leads l ON l.id = e.lead_id
     WHERE l.source = $1
     ORDER BY e.created_at ASC`,
    [source],
  );

  const statusQ = q<{ status: LeadStatus; count: number }>(
    `SELECT status, count(*)::int AS count FROM leads
     WHERE source = $1 ${IN_WINDOW} ${inChannel}
     GROUP BY status`,
    bounds,
  );

  const channelsQ = q<{ channel: Channel; count: number }>(
    `SELECT (${CHANNEL_SQL}) AS channel, count(*)::int AS count FROM leads
     WHERE source = $1 ${IN_WINDOW}
     GROUP BY 1`,
    bounds,
  );

  const countriesQ = q<CountryCount>(
    `SELECT country_name AS "countryName", count(*)::int AS count FROM leads
     WHERE source = $1 AND country_name <> '' ${IN_WINDOW} ${inChannel}
     GROUP BY country_name
     ORDER BY count DESC, country_name ASC
     LIMIT 6`,
    bounds,
  );

  /* Fill every day of the window so quiet days chart as zero, not a gap.
     An unbounded window still needs something to draw, so it falls back to
     the first lead this page ever took, or a fortnight, whichever is longer. */
  const dailyQ = q<DailyPoint>(
    `WITH bounds AS (
       SELECT COALESCE(
                $2::date,
                LEAST(
                  COALESCE(
                    (SELECT min(created_at)::date FROM leads WHERE source = $1 ${inChannel}),
                    now()::date
                  ),
                  (now() - interval '13 days')::date
                )
              ) AS start_day,
              COALESCE($3::date, now()::date) AS end_day
     )
     SELECT to_char(day, 'YYYY-MM-DD') AS date,
            COALESCE(hits.count, 0)::int AS count
     FROM bounds,
          generate_series(bounds.start_day, bounds.end_day, interval '1 day') AS day
     LEFT JOIN (
       SELECT created_at::date AS d, count(*)::int AS count
       FROM leads WHERE source = $1 ${inChannel}
       GROUP BY 1
     ) hits ON hits.d = day
     ORDER BY day ASC`,
    bounds,
  );

  /* Same query as the status counts, over the window immediately before this
     one, so the delta compares like with like whatever the range is. */
  const prev = previousWindow(window);
  const previousQ = prev
    ? q<{ count: number }>(
        `SELECT count(*)::int AS count FROM leads
         WHERE source = $1 ${IN_WINDOW} ${inChannel}`,
        [source, prev.start, prev.end],
      )
    : Promise.resolve(null);

  const [leads, events, statusRows, channelRows, countries, daily, previous] = await Promise.all([
    leadsQ,
    eventsQ,
    statusQ,
    channelsQ,
    countriesQ,
    dailyQ,
    previousQ,
  ]);

  const pipeline: StatusCounts = {
    lead: 0,
    first_contact: 0,
    mql: 0,
    sql: 0,
    customer: 0,
    duplicated: 0,
    not_qualified: 0,
  };
  for (const row of statusRows) pipeline[row.status] = row.count;

  const channels: ChannelCounts = { google: 0, meta: 0, other: 0 };
  for (const row of channelRows) channels[row.channel] = row.count;

  const total = LEAD_STATUSES.reduce((sum, status) => sum + pipeline[status], 0);

  /* Every lead captured reached the lead stage, duplicates and disqualified
     ones included — the enquiry happened, and dropping them here would make
     "Leads captured" fall whenever someone tidied the pipeline. First contact
     counts as lead too: it is a checkpoint on the way to MQL, not a stage the
     funnel measures.

     The three stages above it are read off the current status, so a lead
     disqualified after being marked MQL stops counting towards MQL. That is
     the honest reading of "reached at least this stage" from a single status
     column; the stage it was disqualified from is in its history. */
  const reached: FunnelCounts = {
    customer: pipeline.customer,
    sql: pipeline.sql + pipeline.customer,
    mql: pipeline.mql + pipeline.sql + pipeline.customer,
    lead: total,
  };

  return {
    leads,
    events,
    daily,
    countries,
    pipeline,
    reached,
    channels,
    total,
    previousTotal: previous ? previous[0].count : null,
  };
}
