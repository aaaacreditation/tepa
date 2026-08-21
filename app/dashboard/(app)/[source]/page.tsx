import Link from "next/link";
import { notFound } from "next/navigation";
import { getUploadsForSource } from "@/lib/conversions";
import {
  LEAD_STATUSES,
  STAGE_COLORS,
  STATUS_LABEL,
} from "@/lib/lead-status";
import { getDashboardData } from "@/lib/leads";
import { getSource } from "@/lib/sources";
import { BarList, type BarRow } from "@/app/dashboard/components/BarList";
import {
  LeadsTable,
  type TableEvent,
  type TableLead,
  type TableUpload,
} from "@/app/dashboard/components/LeadsTable";
import { RangeFilter } from "@/app/dashboard/components/RangeFilter";
import { StatTile } from "@/app/dashboard/components/StatTile";
import { TimeSeriesChart } from "@/app/dashboard/components/TimeSeriesChart";

const RANGES: Record<string, { days: number | null; label: string }> = {
  "7": { days: 7, label: "last 7 days" },
  "30": { days: 30, label: "last 30 days" },
  "90": { days: 90, label: "last 90 days" },
  all: { days: null, label: "all time" },
};

const dayFmt = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" });
const fullFmt = new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" });

/* Fold a daily series into at most `n` buckets for the stat tile sparkline. */
function bucket(values: number[], n: number): number[] {
  if (values.length <= n) return values;
  const size = values.length / n;
  return Array.from({ length: n }, (_, i) =>
    values
      .slice(Math.floor(i * size), Math.floor((i + 1) * size))
      .reduce((sum, v) => sum + v, 0),
  );
}

function share(part: number, whole: number): number {
  return whole > 0 ? Math.round((part / whole) * 100) : 0;
}

export default async function SourceDashboard({
  params,
  searchParams,
}: {
  params: Promise<{ source: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { source: key } = await params;
  const source = getSource(key);
  if (!source) notFound();

  const sp = await searchParams;
  const rangeKey = typeof sp.range === "string" && sp.range in RANGES ? sp.range : "30";
  const range = RANGES[rangeKey];

  const [data, uploads] = await Promise.all([
    getDashboardData(source.key, range.days),
    getUploadsForSource(source.key),
  ]);
  const { reached, pipeline, total } = data;

  /* Group the outbox by lead so each row can show what actually reached Google
     Ads. Without this the upload is invisible and a silent credential failure
     would only surface as conversions quietly missing from the ad account. */
  const uploadsByLead: Record<number, TableUpload[]> = {};
  for (const upload of uploads) {
    (uploadsByLead[upload.leadId] ??= []).push({
      id: upload.id,
      stage: upload.stage,
      status: upload.status,
      attempts: upload.attempts,
      lastError: upload.lastError,
      valueLabel: `${upload.currency} ${Number(upload.value).toLocaleString("en-US")}`,
      sentLabel: upload.sentAt ? fullFmt.format(new Date(upload.sentAt)) : "",
    });
  }

  const points = data.daily.map((d) => ({
    date: d.date,
    label: dayFmt.format(new Date(`${d.date}T12:00:00Z`)),
    value: d.count,
  }));

  const deltaPct =
    data.previousTotal !== null && data.previousTotal > 0
      ? Math.round(((total - data.previousTotal) / data.previousTotal) * 100)
      : null;

  const pipelineRows: BarRow[] = LEAD_STATUSES.map((status) => ({
    key: status,
    label: STATUS_LABEL[status],
    value: pipeline[status],
    color: STAGE_COLORS[status],
    tip: [`${share(pipeline[status], total)}% of leads in range`],
  }));

  const countryRows: BarRow[] = data.countries.map((c) => ({
    key: c.countryName,
    label: c.countryName,
    value: c.count,
    color: "#1f5993",
    tip: [`${share(c.count, total)}% of leads in range`],
  }));

  const tableLeads: TableLead[] = data.leads.map((lead) => ({
    id: lead.id,
    fullName: lead.fullName,
    organization: lead.organization,
    email: lead.email,
    phone: lead.phone,
    countryName: lead.countryName,
    website: lead.website,
    message: lead.message,
    status: lead.status,
    notes: lead.notes,
    isDemo: lead.isDemo,
    createdLabel: dayFmt.format(new Date(lead.createdAt)),
    createdFull: fullFmt.format(new Date(lead.createdAt)),
    statusChangedFull: fullFmt.format(new Date(lead.statusChangedAt)),
    clickId: lead.gclid || lead.gbraid || lead.wbraid,
    campaign: lead.utmCampaign,
    utmSource: lead.utmSource,
    utmMedium: lead.utmMedium,
    uploads: uploadsByLead[lead.id] ?? [],
    organizationType: lead.organizationType,
    programCount: lead.programCount,
    contactRole: lead.contactRole,
    qualificationScore: lead.qualificationScore,
    /* '' for every lead created before qualification existed. The table reads
       that as unscored and shows no badge, rather than showing a verdict the
       scorer never actually reached. */
    qualificationTier: lead.qualificationTier,
    qualificationReasons: lead.qualificationReasons ?? [],
  }));

  const eventsByLead: Record<number, TableEvent[]> = {};
  for (const event of data.events) {
    (eventsByLead[event.leadId] ??= []).push({
      id: event.id,
      label: `${STATUS_LABEL[event.fromStatus]} → ${STATUS_LABEL[event.toStatus]} · ${
        event.changedBy
      } · ${fullFmt.format(new Date(event.createdAt))}`,
    });
  }

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="dash-eyebrow text-gold-600">Landing page</p>
          <h1 className="dash-display mt-1 text-[1.6rem] text-navy-800 sm:text-[1.85rem]">
            {source.name}
          </h1>
        </div>
        <Link
          href={source.path}
          target="_blank"
          className="dash-btn dash-btn-quiet !py-2 text-[0.8125rem]"
        >
          View page ↗
        </Link>
      </header>

      <RangeFilter current={rangeKey} basePath={`/dashboard/${source.key}`} />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Key numbers">
        <StatTile
          label="Leads captured"
          value={total.toLocaleString("en-US")}
          delta={deltaPct !== null ? { pct: deltaPct, label: `vs previous ${range.label.replace("last ", "")}` } : null}
          sub={data.previousTotal === 0 ? "Nothing in the previous period" : undefined}
          spark={bucket(points.map((p) => p.value), 12)}
        />
        <StatTile
          label="Marketing qualified"
          value={reached.mql.toLocaleString("en-US")}
          sub={`${share(reached.mql, total)}% of leads`}
        />
        <StatTile
          label="Sales qualified"
          value={reached.sql.toLocaleString("en-US")}
          sub={`${share(reached.sql, total)}% of leads`}
        />
        <StatTile
          label="Customers"
          value={reached.customer.toLocaleString("en-US")}
          sub={`${share(reached.customer, total)}% win rate`}
        />
      </section>

      <section className="dash-card p-5 sm:p-6">
        <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-[0.9375rem] font-semibold text-ink-900">Leads per day</h2>
          <p className="text-xs text-ink-500">Form enquiries received, {range.label}</p>
        </div>
        <TimeSeriesChart points={points} />
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="dash-card p-5 sm:p-6">
          <div className="mb-5 flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="text-[0.9375rem] font-semibold text-ink-900">Pipeline today</h2>
            <p className="text-xs text-ink-500">Current stage of each lead in range</p>
          </div>
          <BarList rows={pipelineRows} labelWidth={86} ariaLabel="Leads by pipeline stage" />
        </div>
        <div className="dash-card p-5 sm:p-6">
          <div className="mb-5 flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="text-[0.9375rem] font-semibold text-ink-900">Top countries</h2>
            <p className="text-xs text-ink-500">Where enquiries come from, {range.label}</p>
          </div>
          {countryRows.length > 0 ? (
            <BarList rows={countryRows} labelWidth={128} ariaLabel="Leads by country" />
          ) : (
            <p className="py-8 text-center text-sm text-ink-500">No leads in this range yet.</p>
          )}
        </div>
      </section>

      <section className="dash-card" aria-label="Leads">
        <LeadsTable leads={tableLeads} events={eventsByLead} />
      </section>
    </div>
  );
}
