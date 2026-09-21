import type { DateWindow } from "@/lib/leads";

/* The dashboard's date ranges, resolved in one place so the chips, the query
   string, the SQL window and every caption on the page agree about what "this
   week" means.

   Everything is computed in UTC, because that is the timezone the rows are
   bucketed by: the daily chart groups on created_at::date and the server runs
   UTC, so resolving "today" against the reader's own clock would draw a window
   that does not line up with the bars inside it. */

const DAY = 86_400_000;

export const DEFAULT_RANGE = "30";

export type RangeKey = "today" | "week" | "7" | "30" | "90" | "year" | "all" | "custom";

export const RANGE_OPTIONS: ReadonlyArray<{ key: RangeKey; label: string }> = [
  { key: "today", label: "Today" },
  { key: "week", label: "This week" },
  { key: "7", label: "Last 7 days" },
  { key: "30", label: "Last 30 days" },
  { key: "90", label: "Last 90 days" },
  { key: "year", label: "This year" },
  { key: "all", label: "All time" },
];

export type ResolvedRange = {
  key: RangeKey;
  window: DateWindow;
  /* Reads after "leads in range", e.g. "leads in the last 30 days". */
  label: string;
  /* Reads after "vs previous", or null when there is nothing to compare. */
  previousLabel: string | null;
  /* Echoed back into the two date inputs. */
  from: string;
  to: string;
};

const ISO_DAY = /^\d{4}-\d{2}-\d{2}$/;

const iso = (ms: number) => new Date(ms).toISOString().slice(0, 10);

function startOfTodayUTC(): number {
  const now = new Date();
  return Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
}

/* A calendar day the Date constructor also agrees exists, so "2026-02-31"
   is rejected rather than silently rolling into March. */
export function validDay(value: unknown): value is string {
  if (typeof value !== "string" || !ISO_DAY.test(value)) return false;
  const ms = Date.parse(`${value}T00:00:00Z`);
  return !Number.isNaN(ms) && iso(ms) === value;
}

export function isRangeKey(value: unknown): value is RangeKey {
  return (
    typeof value === "string" &&
    (value === "custom" || RANGE_OPTIONS.some((option) => option.key === value))
  );
}

const rangeFmt = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

function describe(from: string, to: string): string {
  const a = new Date(`${from}T12:00:00Z`);
  const b = new Date(`${to}T12:00:00Z`);
  if (from === to) return rangeFmt.format(a);
  return `${rangeFmt.format(a)} – ${rangeFmt.format(b)}`;
}

/* Turns whatever arrived in the query string into a window. Anything
   unreadable falls back to the default rather than erroring: a dashboard is
   not the place to punish a hand-edited URL. */
export function resolveRange(
  rangeParam: unknown,
  fromParam: unknown,
  toParam: unknown,
): ResolvedRange {
  const today = startOfTodayUTC();
  const todayISO = iso(today);

  /* A custom range is whatever the two inputs say, whether or not the key
     came along with them, so a shared link with only from/to still works. */
  if (rangeParam === "custom" || validDay(fromParam) || validDay(toParam)) {
    let from = validDay(fromParam) ? fromParam : todayISO;
    let to = validDay(toParam) ? toParam : todayISO;
    /* Picked backwards; read it as the range they meant. */
    if (Date.parse(`${from}T00:00:00Z`) > Date.parse(`${to}T00:00:00Z`)) {
      [from, to] = [to, from];
    }
    return {
      key: "custom",
      window: { start: from, end: to },
      label: describe(from, to),
      previousLabel: "period",
      from,
      to,
    };
  }

  const key: RangeKey = isRangeKey(rangeParam) ? rangeParam : (DEFAULT_RANGE as RangeKey);

  if (key === "all") {
    return {
      key,
      window: { start: null, end: null },
      label: "all time",
      previousLabel: null,
      from: "",
      to: todayISO,
    };
  }

  let start: number;
  let label: string;
  let previousLabel: string;

  if (key === "today") {
    start = today;
    label = "today";
    previousLabel = "day";
  } else if (key === "week") {
    /* Weeks start on Monday: getUTCDay() is 0 on Sunday, so shift it. */
    const offset = (new Date(today).getUTCDay() + 6) % 7;
    start = today - offset * DAY;
    label = "this week";
    previousLabel = "week";
  } else if (key === "year") {
    start = Date.UTC(new Date(today).getUTCFullYear(), 0, 1);
    label = "this year";
    previousLabel = "year";
  } else {
    const days = Number(key);
    start = today - (days - 1) * DAY;
    label = `last ${days} days`;
    previousLabel = `${days} days`;
  }

  return {
    key,
    window: { start: iso(start), end: todayISO },
    label,
    previousLabel,
    from: iso(start),
    to: todayISO,
  };
}
