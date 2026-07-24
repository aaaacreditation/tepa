"use client";

import { useEffect, useMemo, useRef, useState } from "react";

export type SeriesPoint = { date: string; label: string; value: number };

const NAVY = "#1f5993";
const GRID = "#eceae3";
const MUTED = "#5d6c7b";
const H = 236;
const PAD = { top: 14, right: 16, bottom: 28, left: 42 };

function niceStep(raw: number): number {
  const mag = 10 ** Math.floor(Math.log10(Math.max(raw, 1e-6)));
  for (const m of [1, 2, 5, 10]) {
    if (raw <= m * mag) return m * mag;
  }
  return 10 * mag;
}

/* Single series area chart: 2px line, 10% wash, crosshair tooltip that snaps
   to the nearest day. Arrow keys walk the days once the chart has focus. */
export function TimeSeriesChart({ points, unit = "lead" }: { points: SeriesPoint[]; unit?: string }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(720);
  const [active, setActive] = useState<number | null>(null);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      setWidth(Math.max(320, Math.floor(entries[0].contentRect.width)));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const n = points.length;
  const geom = useMemo(() => {
    const max = Math.max(1, ...points.map((p) => p.value));
    const step = Math.max(1, niceStep(max / 4));
    let yMax = step * Math.ceil(max / step);
    if (yMax / step < 3) yMax = step * 3;
    const innerW = width - PAD.left - PAD.right;
    const innerH = H - PAD.top - PAD.bottom;
    const x = (i: number) => PAD.left + (n > 1 ? (i * innerW) / (n - 1) : innerW / 2);
    const y = (v: number) => PAD.top + innerH * (1 - v / yMax);
    const ticks: number[] = [];
    for (let v = 0; v <= yMax; v += step) ticks.push(v);
    return { x, y, yMax, ticks, innerW, innerH };
  }, [points, width, n]);

  if (n === 0) return null;
  const { x, y, ticks } = geom;

  const linePts = points.map((p, i) => `${x(i).toFixed(1)},${y(p.value).toFixed(1)}`).join(" ");
  const baseline = y(0);
  const areaPath =
    `M ${x(0).toFixed(1)} ${baseline.toFixed(1)} ` +
    points.map((p, i) => `L ${x(i).toFixed(1)} ${y(p.value).toFixed(1)}`).join(" ") +
    ` L ${x(n - 1).toFixed(1)} ${baseline.toFixed(1)} Z`;

  const labelEvery = Math.max(1, Math.ceil(n / 6));
  const xLabels = points
    .map((p, i) => ({ p, i }))
    .filter(({ i }) => i % labelEvery === 0 || i === n - 1);

  function pick(clientX: number) {
    const rect = wrapRef.current?.getBoundingClientRect();
    if (!rect) return;
    const px = clientX - rect.left;
    const stepX = n > 1 ? (width - PAD.left - PAD.right) / (n - 1) : 1;
    const idx = Math.min(n - 1, Math.max(0, Math.round((px - PAD.left) / stepX)));
    setActive(idx);
  }

  function onKeyDown(event: React.KeyboardEvent) {
    if (event.key === "ArrowRight") setActive((i) => Math.min(n - 1, (i ?? n - 1) + 1));
    else if (event.key === "ArrowLeft") setActive((i) => Math.max(0, (i ?? n - 1) - 1));
    else if (event.key === "Home") setActive(0);
    else if (event.key === "End") setActive(n - 1);
    else if (event.key === "Escape") setActive(null);
    else return;
    event.preventDefault();
  }

  const activePoint = active === null ? null : points[active];
  const tipLeft = active === null ? 0 : Math.min(Math.max(x(active), 64), width - 64);

  return (
    <div
      ref={wrapRef}
      className="relative outline-none"
      tabIndex={0}
      role="img"
      aria-label={`Leads per day, ${n} days. Use arrow keys to read values.`}
      onKeyDown={onKeyDown}
      onPointerMove={(e) => pick(e.clientX)}
      onPointerLeave={() => setActive(null)}
      onBlur={() => setActive(null)}
    >
      <svg width={width} height={H} className="block">
        {ticks.map((v) => (
          <g key={v}>
            <line x1={PAD.left} x2={width - PAD.right} y1={y(v)} y2={y(v)} stroke={GRID} strokeWidth={1} />
            <text x={PAD.left - 8} y={y(v) + 3.5} textAnchor="end" fontSize={11} fill={MUTED}>
              {v.toLocaleString("en-US")}
            </text>
          </g>
        ))}

        <path d={areaPath} fill={NAVY} fillOpacity={0.1} />
        <polyline
          points={linePts}
          fill="none"
          stroke={NAVY}
          strokeWidth={2}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {/* End marker with a surface ring so it stays legible on the line. */}
        <circle cx={x(n - 1)} cy={y(points[n - 1].value)} r={4.5} fill={NAVY} stroke="#ffffff" strokeWidth={2} />

        {xLabels.map(({ p, i }) => (
          <text key={p.date} x={x(i)} y={H - 8} textAnchor="middle" fontSize={11} fill={MUTED}>
            {p.label}
          </text>
        ))}

        {active !== null && (
          <g pointerEvents="none">
            <line x1={x(active)} x2={x(active)} y1={PAD.top} y2={H - PAD.bottom} stroke="#a9c6e2" strokeWidth={1} />
            <circle cx={x(active)} cy={y(points[active].value)} r={5} fill={NAVY} stroke="#ffffff" strokeWidth={2} />
          </g>
        )}
      </svg>

      {activePoint && (
        <div
          className="dash-tip"
          style={{ left: tipLeft, top: y(activePoint.value) - 12, transform: "translate(-50%, -100%)" }}
        >
          <span className="tip-value">
            {activePoint.value.toLocaleString("en-US")} {activePoint.value === 1 ? unit : `${unit}s`}
          </span>{" "}
          <span className="tip-label">{activePoint.label}</span>
        </div>
      )}
    </div>
  );
}
