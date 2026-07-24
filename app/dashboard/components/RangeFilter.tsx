import Link from "next/link";

const OPTIONS = [
  { key: "7", label: "Last 7 days" },
  { key: "30", label: "Last 30 days" },
  { key: "90", label: "Last 90 days" },
  { key: "all", label: "All time" },
] as const;

export function RangeFilter({ current, basePath }: { current: string; basePath: string }) {
  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label="Date range">
      {OPTIONS.map((option) => (
        <Link
          key={option.key}
          href={option.key === "30" ? basePath : `${basePath}?range=${option.key}`}
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
