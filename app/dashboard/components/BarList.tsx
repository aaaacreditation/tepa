"use client";

import { useRef, useState } from "react";

export type BarRow = {
  key: string;
  label: string;
  value: number;
  color: string;
  /* Extra tooltip lines. The count itself is always directly labeled. */
  tip?: string[];
};

/* Horizontal bar list: 18px bars, rounded data end, value at the tip, full
   row hit target with a hover tooltip for the percentage detail. */
export function BarList({
  rows,
  labelWidth = 100,
  ariaLabel,
}: {
  rows: BarRow[];
  labelWidth?: number;
  ariaLabel: string;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [tip, setTip] = useState<{ x: number; y: number; row: BarRow } | null>(null);

  const max = Math.max(1, ...rows.map((r) => r.value));

  function show(row: BarRow, clientX: number, clientY: number) {
    const rect = wrapRef.current?.getBoundingClientRect();
    if (!rect) return;
    setTip({ x: clientX - rect.left, y: clientY - rect.top - 10, row });
  }

  function showFromElement(row: BarRow, el: HTMLElement) {
    const rect = wrapRef.current?.getBoundingClientRect();
    if (!rect) return;
    const own = el.getBoundingClientRect();
    setTip({ x: own.left - rect.left + Math.min(own.width * 0.5, 180), y: own.top - rect.top - 6, row });
  }

  return (
    <div ref={wrapRef} className="relative" onPointerLeave={() => setTip(null)}>
      <ul className="space-y-3" aria-label={ariaLabel}>
        {rows.map((row) => {
          const pct = (row.value / max) * 100;
          const inside = pct > 78;
          return (
            <li key={row.key} className="flex items-center gap-3">
              <span
                className="shrink-0 truncate text-[0.8125rem] font-medium text-ink-700"
                style={{ width: labelWidth }}
                title={row.label}
              >
                {row.label}
              </span>
              <div
                className="dash-track"
                tabIndex={0}
                role="img"
                aria-label={`${row.label}: ${row.value.toLocaleString("en-US")}`}
                onPointerMove={(e) => show(row, e.clientX, e.clientY)}
                onFocus={(e) => showFromElement(row, e.currentTarget)}
                onBlur={() => setTip(null)}
              >
                {row.value > 0 && (
                  <span
                    className="dash-bar"
                    style={{ width: `max(${pct}%, 3px)`, background: row.color }}
                  />
                )}
                <span
                  className="dash-bar-value"
                  style={
                    inside
                      ? { left: `calc(${pct}% - 8px)`, transform: "translate(-100%, -50%)", color: "#ffffff" }
                      : { left: `calc(${pct}% + 8px)`, color: "#33414f" }
                  }
                >
                  {row.value.toLocaleString("en-US")}
                </span>
              </div>
            </li>
          );
        })}
      </ul>

      {tip && (
        <div className="dash-tip" style={{ left: tip.x, top: tip.y, transform: "translate(-50%, -100%)" }}>
          <span className="tip-value">{tip.row.value.toLocaleString("en-US")}</span>{" "}
          <span className="tip-label">{tip.row.label}</span>
          {tip.row.tip?.map((line) => (
            <div key={line} className="tip-label">
              {line}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
