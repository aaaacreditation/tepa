/* Inline SVG so the page ships no icon dependency and no extra request.
   Stroke icons share one wrapper; the brand marks are filled and stand alone. */

type IconProps = { className?: string };

function Stroke({ className, children }: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {children}
    </svg>
  );
}

export function IconArrow({ className }: IconProps) {
  return (
    <Stroke className={className}>
      <path d="M5 12h14" />
      <path d="m13 6 6 6-6 6" />
    </Stroke>
  );
}

export function IconCheck({ className }: IconProps) {
  return (
    <Stroke className={className}>
      <path d="m4.5 12.5 5 5 10-11" />
    </Stroke>
  );
}

export function IconCheckCircle({ className }: IconProps) {
  return (
    <Stroke className={className}>
      <circle cx="12" cy="12" r="9" />
      <path d="m8 12.3 2.6 2.6L16 9.5" />
    </Stroke>
  );
}

export function IconShield({ className }: IconProps) {
  return (
    <Stroke className={className}>
      <path d="M12 3 4.5 6v6c0 4.5 3.2 7.9 7.5 9 4.3-1.1 7.5-4.5 7.5-9V6Z" />
      <path d="m9 12 2.2 2.2L15.5 10" />
    </Stroke>
  );
}

export function IconClipboard({ className }: IconProps) {
  return (
    <Stroke className={className}>
      <path d="M9 4.5h6v3H9z" />
      <path d="M15 6h2.5a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1h-11a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1H9" />
      <path d="m9.2 13.4 1.9 1.9 3.7-4" />
    </Stroke>
  );
}

export function IconBolt({ className }: IconProps) {
  return (
    <Stroke className={className}>
      <path d="M13.2 3 5.5 13.4h5.4L10.4 21l7.7-10.4h-5.4Z" />
    </Stroke>
  );
}

export function IconGlobe({ className }: IconProps) {
  return (
    <Stroke className={className}>
      <circle cx="12" cy="12" r="9" />
      <path d="M3.2 9.5h17.6M3.2 14.5h17.6" />
      <path d="M12 3c2.4 2.5 3.6 5.5 3.6 9s-1.2 6.5-3.6 9c-2.4-2.5-3.6-5.5-3.6-9S9.6 5.5 12 3Z" />
    </Stroke>
  );
}

export function IconTrend({ className }: IconProps) {
  return (
    <Stroke className={className}>
      <path d="M4 17.5 9.5 12l3.5 3.5L20 8.5" />
      <path d="M15.5 8.5H20V13" />
    </Stroke>
  );
}

export function IconPlane({ className }: IconProps) {
  return (
    <Stroke className={className}>
      <path d="M10.5 4.2a1.5 1.5 0 0 1 3 0V9l7 4v2.3l-7-2.1v3.9l2.3 1.7v1.6L12 19.5l-3.8 1-.1-1.6 2.4-1.7v-3.9l-7 2.1V13l7-4Z" />
    </Stroke>
  );
}

export function IconTarget({ className }: IconProps) {
  return (
    <Stroke className={className}>
      <circle cx="12" cy="12" r="8.5" />
      <circle cx="12" cy="12" r="4.8" />
      <circle cx="12" cy="12" r="1.4" />
    </Stroke>
  );
}

export function IconEye({ className }: IconProps) {
  return (
    <Stroke className={className}>
      <path d="M2.8 12S6.4 5.8 12 5.8 21.2 12 21.2 12 17.6 18.2 12 18.2 2.8 12 2.8 12Z" />
      <circle cx="12" cy="12" r="3.1" />
    </Stroke>
  );
}

export function IconPulse({ className }: IconProps) {
  return (
    <Stroke className={className}>
      <path d="M20.5 11h-3.2l-2 4.5-3.4-9-2.3 6-1.6-3H3.5" />
      <path d="M4.6 13.6a4.9 4.9 0 0 1 6.9-6.8" />
    </Stroke>
  );
}

export function IconUserCheck({ className }: IconProps) {
  return (
    <Stroke className={className}>
      <circle cx="9.8" cy="8" r="3.6" />
      <path d="M3.4 19.4c.5-3.2 3.2-5.4 6.4-5.4 1.2 0 2.3.3 3.3.8" />
      <path d="m15 16.8 2 2 4-4.4" />
    </Stroke>
  );
}

export function IconBuilding({ className }: IconProps) {
  return (
    <Stroke className={className}>
      <path d="M4.5 20.5V5.2a1 1 0 0 1 .7-.95l7-2.1a1 1 0 0 1 1.3.95V20.5" />
      <path d="M13.5 9.5h4.8a1 1 0 0 1 1 1v10M2.8 20.5h18.4" />
      <path d="M8 8.2h2.2M8 12h2.2M8 15.8h2.2" />
    </Stroke>
  );
}

export function IconChart({ className }: IconProps) {
  return (
    <Stroke className={className}>
      <path d="M4 20.2h16" />
      <path d="M7 20V11M12 20V5M17 20v-6" />
    </Stroke>
  );
}

export function IconSupport({ className }: IconProps) {
  return (
    <Stroke className={className}>
      <path d="M4.5 14.5v-2.4a7.5 7.5 0 0 1 15 0v2.4" />
      <rect x="2.8" y="13.4" width="3.6" height="5.6" rx="1.6" />
      <rect x="17.6" y="13.4" width="3.6" height="5.6" rx="1.6" />
      <path d="M19.4 19a3.4 3.4 0 0 1-3.4 2.4h-2.2" />
    </Stroke>
  );
}

export function IconUsers({ className }: IconProps) {
  return (
    <Stroke className={className}>
      <circle cx="9.2" cy="8.2" r="3.4" />
      <path d="M2.8 19.4c.5-3.2 3.2-5.5 6.4-5.5s5.9 2.3 6.4 5.5" />
      <path d="M16 5.2a3.4 3.4 0 0 1 0 6.5" />
      <path d="M17.4 14.2c2.1.6 3.6 2.4 3.9 4.6" />
    </Stroke>
  );
}

export function IconPlay({ className }: IconProps) {
  return (
    <Stroke className={className}>
      <path d="M9.4 7.6 16.6 12l-7.2 4.4Z" />
    </Stroke>
  );
}

export function IconHelp({ className }: IconProps) {
  return (
    <Stroke className={className}>
      <circle cx="12" cy="12" r="9" />
      <path d="M9.5 9.4a2.6 2.6 0 0 1 5 .9c0 1.7-2.5 2.1-2.5 3.7" />
      <path d="M12 17.2h.01" />
    </Stroke>
  );
}

export function IconMinus({ className }: IconProps) {
  return (
    <Stroke className={className}>
      <path d="M6.5 12h11" />
    </Stroke>
  );
}

export function IconCircle({ className }: IconProps) {
  return (
    <Stroke className={className}>
      <circle cx="12" cy="12" r="6.4" />
    </Stroke>
  );
}

export function IconArrowLeft({ className }: IconProps) {
  return (
    <Stroke className={className}>
      <path d="M19 12H5" />
      <path d="m11 6-6 6 6 6" />
    </Stroke>
  );
}

export function IconLock({ className }: IconProps) {
  return (
    <Stroke className={className}>
      <rect x="4.8" y="10.2" width="14.4" height="10" rx="2" />
      <path d="M8.4 10.2V7.6a3.6 3.6 0 0 1 7.2 0v2.6" />
    </Stroke>
  );
}

export function IconPhone({ className }: IconProps) {
  return (
    <Stroke className={className}>
      <path d="M7.6 3.5H4.9a1.7 1.7 0 0 0-1.7 1.9c.6 5.3 5.1 9.8 10.4 10.4a1.7 1.7 0 0 0 1.9-1.7v-2.7l-3.4-1.1-1.4 1.7a12.4 12.4 0 0 1-4.3-4.3l1.7-1.4Z" />
      <path d="M15.5 8.5 20.8 3.2M20.8 3.2h-4M20.8 3.2v4" />
    </Stroke>
  );
}

export function IconMail({ className }: IconProps) {
  return (
    <Stroke className={className}>
      <rect x="3" y="5.4" width="18" height="13.2" rx="2" />
      <path d="m3.6 6.6 8.4 6 8.4-6" />
    </Stroke>
  );
}

export function IconPin({ className }: IconProps) {
  return (
    <Stroke className={className}>
      <path d="M12 21.2s6.8-5.6 6.8-10.6a6.8 6.8 0 0 0-13.6 0c0 5 6.8 10.6 6.8 10.6Z" />
      <circle cx="12" cy="10.4" r="2.6" />
    </Stroke>
  );
}

/* Brand marks. Filled, single path, no stroke. */

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

export function IconWhatsApp({ className }: IconProps) {
  return (
    <Brand className={className}>
      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38c1.45.79 3.08 1.21 4.79 1.21h.01c5.46 0 9.91-4.45 9.91-9.91C21.96 6.45 17.5 2 12.04 2Zm5.8 14.04c-.24.68-1.42 1.32-1.95 1.36-.5.05-1.13.07-1.83-.11-.42-.13-.96-.31-1.65-.61-2.9-1.25-4.79-4.17-4.94-4.36-.14-.19-1.18-1.57-1.18-2.99s.75-2.12 1.01-2.41c.26-.29.57-.36.76-.36l.55.01c.18.01.41-.07.64.49.24.57.82 1.99.89 2.13.07.14.12.31.02.5-.09.19-.14.31-.28.48-.14.17-.29.37-.42.5-.14.14-.28.29-.12.57.16.28.72 1.18 1.54 1.91 1.06.95 1.95 1.24 2.23 1.38.28.14.44.12.6-.07.16-.19.69-.81.88-1.08.18-.28.37-.23.62-.14.25.09 1.6.76 1.87.9.28.14.46.21.53.32.07.12.07.66-.17 1.34Z" />
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

/* Named lookup for the icons the content module refers to by string. */
export const ICONS = {
  shield: IconShield,
  clipboard: IconClipboard,
  bolt: IconBolt,
  globe: IconGlobe,
  trend: IconTrend,
  plane: IconPlane,
  target: IconTarget,
  eye: IconEye,
  pulse: IconPulse,
  userCheck: IconUserCheck,
  building: IconBuilding,
  chart: IconChart,
} as const;

export type IconName = keyof typeof ICONS;
