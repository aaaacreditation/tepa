import "server-only";
import { q } from "./db";
import type { LeadStatus } from "./lead-status";

export { isLeadStatus, LEAD_STATUSES, STATUS_LABEL, type LeadStatus } from "./lead-status";

export type LeadRow = {
  id: number;
  source: string;
  fullName: string;
  organization: string;
  email: string;
  countryCode: string;
  countryName: string;
  phone: string;
  website: string;
  message: string;
  status: LeadStatus;
  notes: string;
  isDemo: boolean;
  createdAt: string;
  statusChangedAt: string;
};

export type LeadEventRow = {
  id: number;
  leadId: number;
  fromStatus: LeadStatus;
  toStatus: LeadStatus;
  changedBy: string;
  createdAt: string;
};

export type NewLead = {
  source: string;
  fullName: string;
  organization: string;
  email: string;
  countryCode: string;
  countryName: string;
  phone: string;
  website: string;
  message: string;
};

const LEAD_COLUMNS = `
  id,
  source,
  full_name          AS "fullName",
  organization,
  email,
  country_code       AS "countryCode",
  country_name       AS "countryName",
  phone,
  website,
  message,
  status,
  notes,
  is_demo            AS "isDemo",
  to_char(created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"')        AS "createdAt",
  to_char(status_changed_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS "statusChangedAt"
`;

export async function insertLead(lead: NewLead): Promise<number> {
  const rows = await q<{ id: number }>(
    `INSERT INTO leads
       (source, full_name, organization, email, country_code, country_name, phone, website, message)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
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
    ],
  );
  return rows[0].id;
}

export async function updateLeadStatus(
  id: number,
  status: LeadStatus,
  changedBy: string,
): Promise<void> {
  const current = await q<{ status: LeadStatus }>(
    "SELECT status FROM leads WHERE id = $1",
    [id],
  );
  if (current.length === 0 || current[0].status === status) return;

  await q("UPDATE leads SET status = $2, status_changed_at = now() WHERE id = $1", [id, status]);
  await q(
    `INSERT INTO lead_events (lead_id, from_status, to_status, changed_by)
     VALUES ($1, $2, $3, $4)`,
    [id, current[0].status, status, changedBy],
  );
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
export type FunnelCounts = Record<LeadStatus, number>;

export type DashboardData = {
  leads: LeadRow[];
  events: LeadEventRow[];
  daily: DailyPoint[];
  countries: CountryCount[];
  /* Leads whose current stage sits at each step of the pipeline. */
  pipeline: FunnelCounts;
  /* Leads that reached at least each stage (funnel view). */
  reached: FunnelCounts;
  total: number;
  previousTotal: number | null;
};

function sinceClause(days: number | null): string {
  return days ? `AND created_at >= now() - make_interval(days => ${Math.floor(days)})` : "";
}

export async function getDashboardData(
  source: string,
  rangeDays: number | null,
): Promise<DashboardData> {
  const since = sinceClause(rangeDays);

  const leadsQ = q<LeadRow>(
    `SELECT ${LEAD_COLUMNS} FROM leads
     WHERE source = $1 ${since}
     ORDER BY created_at DESC
     LIMIT 1000`,
    [source],
  );

  const eventsQ = q<LeadEventRow>(
    `SELECT e.id,
            e.lead_id     AS "leadId",
            e.from_status AS "fromStatus",
            e.to_status   AS "toStatus",
            e.changed_by  AS "changedBy",
            to_char(e.created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS "createdAt"
     FROM lead_events e
     JOIN leads l ON l.id = e.lead_id
     WHERE l.source = $1
     ORDER BY e.created_at ASC`,
    [source],
  );

  const statusQ = q<{ status: LeadStatus; count: number }>(
    `SELECT status, count(*)::int AS count FROM leads
     WHERE source = $1 ${since}
     GROUP BY status`,
    [source],
  );

  const countriesQ = q<CountryCount>(
    `SELECT country_name AS "countryName", count(*)::int AS count FROM leads
     WHERE source = $1 AND country_name <> '' ${since}
     GROUP BY country_name
     ORDER BY count DESC, country_name ASC
     LIMIT 6`,
    [source],
  );

  /* Fill every day of the window so quiet days chart as zero, not a gap. */
  const spanDays = rangeDays ?? null;
  const dailyQ = q<DailyPoint>(
    `WITH bounds AS (
       SELECT CASE
                WHEN $2::int IS NOT NULL THEN (now() - make_interval(days => $2::int - 1))::date
                ELSE LEAST(
                  COALESCE((SELECT min(created_at)::date FROM leads WHERE source = $1), now()::date),
                  (now() - interval '13 days')::date
                )
              END AS start_day
     )
     SELECT to_char(day, 'YYYY-MM-DD') AS date,
            COALESCE(hits.count, 0)::int AS count
     FROM bounds,
          generate_series(bounds.start_day, now()::date, interval '1 day') AS day
     LEFT JOIN (
       SELECT created_at::date AS d, count(*)::int AS count
       FROM leads WHERE source = $1
       GROUP BY 1
     ) hits ON hits.d = day
     ORDER BY day ASC`,
    [source, spanDays],
  );

  const previousQ = rangeDays
    ? q<{ count: number }>(
        `SELECT count(*)::int AS count FROM leads
         WHERE source = $1
           AND created_at >= now() - make_interval(days => ${Math.floor(rangeDays) * 2})
           AND created_at <  now() - make_interval(days => ${Math.floor(rangeDays)})`,
        [source],
      )
    : Promise.resolve(null);

  const [leads, events, statusRows, countries, daily, previous] = await Promise.all([
    leadsQ,
    eventsQ,
    statusQ,
    countriesQ,
    dailyQ,
    previousQ,
  ]);

  const pipeline: FunnelCounts = { lead: 0, mql: 0, sql: 0, customer: 0 };
  for (const row of statusRows) pipeline[row.status] = row.count;

  const reached: FunnelCounts = {
    customer: pipeline.customer,
    sql: pipeline.sql + pipeline.customer,
    mql: pipeline.mql + pipeline.sql + pipeline.customer,
    lead: pipeline.lead + pipeline.mql + pipeline.sql + pipeline.customer,
  };

  return {
    leads,
    events,
    daily,
    countries,
    pipeline,
    reached,
    total: reached.lead,
    previousTotal: previous ? previous[0].count : null,
  };
}
