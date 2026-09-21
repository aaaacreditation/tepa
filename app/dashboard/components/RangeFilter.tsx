import Link from "next/link";
import { filterHref } from "./filter-href";
import { RANGE_OPTIONS, type ResolvedRange } from "./ranges";

/* The presets and a custom window, side by side.

   The custom half is a plain GET form rather than a controlled component: it
   submits to the same page with from/to in the query string, which keeps this
   a server component, keeps the window in the URL where it can be linked, and
   means the two date inputs work with nothing but the browser. The channel
   rides along in a hidden field for the same reason the preset links carry
   it — picking a date must not silently reset the open tab. */
export function RangeFilter({
  range,
  basePath,
  channel,
}: {
  range: ResolvedRange;
  basePath: string;
  /* Carried through so changing the range keeps the open channel tab. */
  channel: string;
}) {
  const custom = range.key === "custom";

  return (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-2.5">
      <div className="flex flex-wrap gap-2" role="group" aria-label="Date range">
        {RANGE_OPTIONS.map((option) => (
          <Link
            key={option.key}
            href={filterHref(basePath, { range: option.key, channel })}
            className="dash-chip"
            data-active={!custom && range.key === option.key}
            aria-current={!custom && range.key === option.key ? "true" : undefined}
          >
            {option.label}
          </Link>
        ))}
      </div>

      <form
        method="get"
        action={basePath}
        className="dash-daterange"
        data-active={custom}
        aria-label="Custom date range"
      >
        <input type="hidden" name="range" value="custom" />
        {channel !== "all" && <input type="hidden" name="channel" value={channel} />}

        <label htmlFor="range-from">From</label>
        <input
          id="range-from"
          name="from"
          type="date"
          defaultValue={range.from}
          max={range.to || undefined}
          required
        />

        <label htmlFor="range-to">To</label>
        <input id="range-to" name="to" type="date" defaultValue={range.to} required />

        <button type="submit">Apply</button>
      </form>

      {custom && (
        <Link
          href={filterHref(basePath, { range: "30", channel })}
          className="dash-chip-clear"
          aria-label="Clear the custom range"
        >
          Clear
        </Link>
      )}
    </div>
  );
}
