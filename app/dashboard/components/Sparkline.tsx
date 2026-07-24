/* Presentational sparkline: de-emphasis navy for the history, brand navy dot
   on the current bucket. Renders on the server, no interactivity. */
export function Sparkline({
  values,
  width = 104,
  height = 30,
}: {
  values: number[];
  width?: number;
  height?: number;
}) {
  if (values.length < 2) return null;

  const max = Math.max(1, ...values);
  const stepX = width / (values.length - 1);
  const y = (v: number) => height - 3 - (height - 6) * (v / max);
  const pts = values.map((v, i) => `${(i * stepX).toFixed(1)},${y(v).toFixed(1)}`).join(" ");

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      aria-hidden="true"
      className="shrink-0 overflow-visible"
    >
      <polyline
        points={pts}
        fill="none"
        stroke="#a9c6e2"
        strokeWidth={2}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <circle
        cx={(values.length - 1) * stepX}
        cy={y(values[values.length - 1])}
        r={3.5}
        fill="#1f5993"
        stroke="#ffffff"
        strokeWidth={2}
      />
    </svg>
  );
}
