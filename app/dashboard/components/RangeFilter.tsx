import Link from "next/link";
import { filterHref } from "./filter-href";

const OPTIONS = [
  { key: "7", label: "Last 7 days" },
  { key: "30", label: "Last 30 days" },
  { key: "90", label: "Last 90 days" },
  { key: "all", label: "All time" },
] as const;

export function RangeFilter({
  current,
  basePath,
  channel,
}: {
  current: string;
  basePath: string;
  /* Carried through so changing the range keeps the open channel tab. */
  channel: string;
}) {
  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label="Date range">
      {OPTIONS.map((option) => (
        <Link
          key={option.key}
          href={filterHref(basePath, { range: option.key, channel })}
          className="dash-chip"
          data-active={current === option.key}
          aria-current={current === option.key ? "true" : undefined}
        >
          {option.label}
        </Link>
      ))}
    </div>
  );
}
