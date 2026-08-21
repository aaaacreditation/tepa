import { result as resultCopy } from "../content";

const RADIUS = 70;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/* `percent` drives the arc and animates from 0; `display` is the number under
   it, which should read the final score immediately rather than counting up
   from zero next to a filling ring. */
export function ScoreRing({ percent, display }: { percent: number; display: number }) {
  const offset = CIRCUMFERENCE - (Math.max(0, Math.min(100, percent)) / 100) * CIRCUMFERENCE;

  return (
    <div className="cl-ring">
      <svg width="170" height="170" viewBox="0 0 170 170" aria-hidden="true">
        <defs>
          <linearGradient id="clRingArc" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#4C9AD4" />
            <stop offset="1" stopColor="#1B3A6B" />
          </linearGradient>
        </defs>
        <circle cx="85" cy="85" r={RADIUS} fill="none" stroke="#E2EAF4" strokeWidth="12" />
        <circle
          className="cl-ring-arc"
          cx="85"
          cy="85"
          r={RADIUS}
          fill="none"
          stroke="url(#clRingArc)"
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE.toFixed(1)}
          strokeDashoffset={offset.toFixed(1)}
        />
      </svg>
      <div className="cl-ring-num">
        <b>{display}</b>
        <span>{resultCopy.scoreLabel}</span>
      </div>
    </div>
  );
}
