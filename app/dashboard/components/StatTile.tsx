import { Sparkline } from "./Sparkline";

export function StatTile({
  label,
  value,
  sub,
  delta,
  spark,
}: {
  label: string;
  value: string;
  sub?: string;
  delta?: { pct: number; label: string } | null;
  spark?: number[];
}) {
  return (
    <div className="dash-card px-5 py-4">
      <div className="flex items-start justify-between gap-3">
        <p className="text-[0.8125rem] font-medium text-ink-500">{label}</p>
        {spark && spark.length > 1 && <Sparkline values={spark} />}
      </div>
      <p className="mt-1.5 text-[1.75rem] font-semibold leading-none text-ink-900">{value}</p>
      {delta ? (
        <p
          className="mt-2 text-xs font-semibold"
          style={{ color: delta.pct >= 0 ? "#1e7f4f" : "#b3392e" }}
        >
          {delta.pct >= 0 ? "▲" : "▼"} {Math.abs(delta.pct)}%{" "}
          <span className="font-normal text-ink-500">{delta.label}</span>
        </p>
      ) : (
        sub && <p className="mt-2 text-xs text-ink-500">{sub}</p>
      )}
    </div>
  );
}
