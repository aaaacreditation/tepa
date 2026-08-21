/* /clinic icon set.

   The glyphs are Lucide (ISC licensed), but drawn here as inline SVG rather
   than pulled from `lucide-react`. Lucide's React components carry a
   "use client" directive, so importing them would turn every icon on this
   otherwise fully server-rendered page into a hydrated client component. The
   geometry is identical — same 24x24 grid, same round caps and joins — and the
   page keeps shipping no icon JavaScript at all.

   Stroke weight is 1.8 rather than Lucide's stock 2. At the 20-28px sizes used
   here a 2px stroke closes up the counters on the denser glyphs; 1.8 keeps
   Lucide's character while letting the detail breathe.

   Brand marks are not part of Lucide and stay hand-drawn below. */

type IconProps = { className?: string };

function Stroke({ className, children }: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {children}
    </svg>
  );
}

/* lucide shield-check */
export function IconShield({ className }: IconProps) {
  return (
    <Stroke className={className}>
      <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
      <path d="m9 12 2 2 4-4" />
    </Stroke>
  );
}

/* lucide heart-pulse */
export function IconPulse({ className }: IconProps) {
  return (
    <Stroke className={className}>
      <path d="M2 9.5a5.5 5.5 0 0 1 9.591-3.676.56.56 0 0 0 .818 0A5.49 5.49 0 0 1 22 9.5c0 2.29-1.5 4-3 5.5l-5.492 5.313a2 2 0 0 1-3 .019L5 15c-1.5-1.5-3-3.2-3-5.5" />
      <path d="M3.22 13H9.5l.5-1 2 4.5 2-7 1.5 3.5h5.27" />
    </Stroke>
  );
}

/* lucide trending-up */
export function IconTrend({ className }: IconProps) {
  return (
    <Stroke className={className}>
      <path d="M16 7h6v6" />
      <path d="m22 7-8.5 8.5-5-5L2 17" />
    </Stroke>
  );
}

/* lucide clipboard-list */
export function IconClipboard({ className }: IconProps) {
  return (
    <Stroke className={className}>
      <rect width="8" height="4" x="8" y="2" rx="1" ry="1" />
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
      <path d="M12 11h4" />
      <path d="M12 16h4" />
      <path d="M8 11h.01" />
      <path d="M8 16h.01" />
    </Stroke>
  );
}

/* lucide user-round-check */
export function IconUserCheck({ className }: IconProps) {
  return (
    <Stroke className={className}>
      <path d="M2 21a8 8 0 0 1 13.292-6" />
      <circle cx="10" cy="8" r="5" />
      <path d="m16 19 2 2 4-4" />
    </Stroke>
  );
}

/* lucide hospital */
export function IconBuilding({ className }: IconProps) {
  return (
    <Stroke className={className}>
      <path d="M12 7v4" />
      <path d="M14 21v-3a2 2 0 0 0-4 0v3" />
      <path d="M14 9h-4" />
      <path d="M18 11h2a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-9a2 2 0 0 1 2-2h2" />
      <path d="M18 21V5a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16" />
    </Stroke>
  );
}

/* lucide chart-no-axes-combined */
export function IconChart({ className }: IconProps) {
  return (
    <Stroke className={className}>
      <path d="M12 16v5" />
      <path d="M16 14.639V21" />
      <path d="M20 10.656V21" />
      <path d="m22 3-8.646 8.646a.5.5 0 0 1-.708 0L9.354 8.354a.5.5 0 0 0-.707 0L2 15" />
      <path d="M4 18.463V21" />
      <path d="M8 14.656V21" />
    </Stroke>
  );
}

/* lucide arrow-right */
export function IconArrow({ className }: IconProps) {
  return (
    <Stroke className={className}>
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
    </Stroke>
  );
}

/* lucide check */
export function IconCheck({ className }: IconProps) {
  return (
    <Stroke className={className}>
      <path d="M20 6 9 17l-5-5" />
    </Stroke>
  );
}

/* lucide globe */
export function IconGlobe({ className }: IconProps) {
  return (
    <Stroke className={className}>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
      <path d="M2 12h20" />
    </Stroke>
  );
}

/* lucide circle-question-mark */
export function IconHelp({ className }: IconProps) {
  return (
    <Stroke className={className}>
      <circle cx="12" cy="12" r="10" />
      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
      <path d="M12 17h.01" />
    </Stroke>
  );
}

/* lucide users-round */
export function IconUsers({ className }: IconProps) {
  return (
    <Stroke className={className}>
      <path d="M18 21a8 8 0 0 0-16 0" />
      <circle cx="10" cy="8" r="5" />
      <path d="M22 20c0-3.37-2-6.5-4-8a5 5 0 0 0-.45-8.3" />
    </Stroke>
  );
}

/* lucide lock */
export function IconLock({ className }: IconProps) {
  return (
    <Stroke className={className}>
      <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </Stroke>
  );
}

/* lucide play */
export function IconPlay({ className }: IconProps) {
  return (
    <Stroke className={className}>
      <path d="M5 5a2 2 0 0 1 3.008-1.728l11.997 6.998a2 2 0 0 1 .003 3.458l-12 7A2 2 0 0 1 5 19z" />
    </Stroke>
  );
}

/* lucide phone */
export function IconPhone({ className }: IconProps) {
  return (
    <Stroke className={className}>
      <path d="M13.832 16.568a1 1 0 0 0 1.213-.303l.355-.465A2 2 0 0 1 17 15h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2A18 18 0 0 1 2 4a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v3a2 2 0 0 1-.8 1.6l-.468.351a1 1 0 0 0-.292 1.233 14 14 0 0 0 6.392 6.384" />
    </Stroke>
  );
}

/* lucide mail */
export function IconMail({ className }: IconProps) {
  return (
    <Stroke className={className}>
      <path d="m22 7-8.991 5.727a2 2 0 0 1-2.009 0L2 7" />
      <rect x="2" y="4" width="20" height="16" rx="2" />
    </Stroke>
  );
}

/* lucide map-pin */
export function IconPin({ className }: IconProps) {
  return (
    <Stroke className={className}>
      <path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0" />
      <circle cx="12" cy="10" r="3" />
    </Stroke>
  );
}


/* ==========================================================================
   Brand marks

   Lucide dropped brand logos, so these stay hand-drawn: filled, single path,
   no stroke. They are trademarks and are not redrawn on the Lucide grid.
   ========================================================================== */

function Brand({ className, children }: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
    >
      {children}
    </svg>
  );
}

export function IconLinkedIn({ className }: IconProps) {
  return (
    <Brand className={className}>
      <path d="M4.98 3.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5ZM3 9.5h4v11H3v-11Zm6.5 0h3.83v1.5h.05a4.2 4.2 0 0 1 3.78-2.08c4.04 0 4.79 2.66 4.79 6.12v5.46h-4v-4.84c0-1.16-.02-2.65-1.61-2.65-1.62 0-1.87 1.26-1.87 2.56v4.93h-4v-11Z" />
    </Brand>
  );
}

export function IconTwitter({ className }: IconProps) {
  return (
    <Brand className={className}>
      <path d="M17.6 3h3.1l-6.77 7.74L21.9 21h-6.2l-4.86-6.35L5.28 21H2.16l7.24-8.28L2.1 3h6.36l4.39 5.81L17.6 3Zm-1.09 16.13h1.72L7.56 4.78H5.72l10.79 14.35Z" />
    </Brand>
  );
}

export function IconFacebook({ className }: IconProps) {
  return (
    <Brand className={className}>
      <path d="M13.5 21v-7.4h2.5l.4-2.9h-2.9V8.85c0-.84.24-1.41 1.44-1.41h1.54V4.85A20.7 20.7 0 0 0 14.24 4.7c-2.22 0-3.74 1.36-3.74 3.85v2.15H8v2.9h2.5V21h3Z" />
    </Brand>
  );
}

export function IconInstagram({ className }: IconProps) {
  return (
    <Brand className={className}>
      <path d="M12 4.8c2.34 0 2.62.01 3.54.05.86.04 1.32.18 1.63.3.41.16.7.35 1.01.66.31.31.5.6.66 1.01.12.31.26.77.3 1.63.04.92.05 1.2.05 3.54s-.01 2.62-.05 3.54c-.04.86-.18 1.32-.3 1.63a2.7 2.7 0 0 1-.66 1.01c-.31.31-.6.5-1.01.66-.31.12-.77.26-1.63.3-.92.04-1.2.05-3.54.05s-2.62-.01-3.54-.05c-.86-.04-1.32-.18-1.63-.3a2.7 2.7 0 0 1-1.01-.66 2.7 2.7 0 0 1-.66-1.01c-.12-.31-.26-.77-.3-1.63C4.81 14.62 4.8 14.34 4.8 12s.01-2.62.05-3.54c.04-.86.18-1.32.3-1.63.16-.41.35-.7.66-1.01.31-.31.6-.5 1.01-.66.31-.12.77-.26 1.63-.3C9.38 4.81 9.66 4.8 12 4.8ZM12 3c-2.38 0-2.68.01-3.61.05-.93.05-1.57.2-2.13.41-.57.23-1.06.53-1.55 1.02-.49.49-.79.98-1.02 1.55-.22.56-.36 1.2-.41 2.13C3.24 9.09 3.23 9.39 3.23 12s.01 2.91.05 3.84c.05.93.19 1.57.41 2.13.23.57.53 1.06 1.02 1.55.49.49.98.79 1.55 1.02.56.22 1.2.36 2.13.41.93.04 1.23.05 3.61.05s2.68-.01 3.61-.05c.93-.05 1.57-.19 2.13-.41a4.3 4.3 0 0 0 1.55-1.02c.49-.49.79-.98 1.02-1.55.22-.56.36-1.2.41-2.13.04-.93.05-1.23.05-3.84s-.01-2.91-.05-3.84c-.05-.93-.19-1.57-.41-2.13a4.3 4.3 0 0 0-1.02-1.55 4.3 4.3 0 0 0-1.55-1.02c-.56-.21-1.2-.36-2.13-.41C14.68 3.01 14.38 3 12 3Zm0 4.38a4.62 4.62 0 1 0 0 9.24 4.62 4.62 0 0 0 0-9.24Zm0 7.62a3 3 0 1 1 0-6 3 3 0 0 1 0 6Zm5.88-7.8a1.08 1.08 0 1 1-2.16 0 1.08 1.08 0 0 1 2.16 0Z" />
    </Brand>
  );
}

/* Named lookup for the icons content.ts refers to by string. */
export const ICONS = {
  shield: IconShield,
  pulse: IconPulse,
  trend: IconTrend,
  clipboard: IconClipboard,
  userCheck: IconUserCheck,
  building: IconBuilding,
  chart: IconChart,
  globe: IconGlobe,
  people: IconUsers,
} as const;

export type IconName = keyof typeof ICONS;
