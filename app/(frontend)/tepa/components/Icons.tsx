type IconProps = { className?: string };

const base = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.4,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export function IconValue({ className }: IconProps) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true" {...base}>
      <path d="M4 22.5c2.6-1.8 5.1-1.6 7.4.2 1 .8 2.1 1.2 3.3 1.2h4.6a2 2 0 0 0 0-4h-4.2" />
      <path d="M11.4 22.7 18 27c.7.4 1.6.3 2.2-.2L28 20" />
      <circle cx="21" cy="11" r="6" />
      <path d="m18.6 11 1.7 1.8 3.4-3.6" />
    </svg>
  );
}

export function IconSatisfaction({ className }: IconProps) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true" {...base}>
      <circle cx="16" cy="12.5" r="7.5" />
      <path d="m13.4 12.6 1.9 2 3.3-3.9" />
      <path d="m11.3 18.8-2.6 8 4.9-2.1 2.4 2.4 2.4-2.4 4.9 2.1-2.6-8" />
    </svg>
  );
}

export function IconQuality({ className }: IconProps) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true" {...base}>
      <path d="M16 3.5 27 7v9.2c0 5.3-4.2 10.2-11 12.3-6.8-2.1-11-7-11-12.3V7z" />
      <path d="m11.6 15.8 3.1 3.2 5.9-6.5" />
    </svg>
  );
}

export function IconCheck({ className }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" className={className} aria-hidden="true" {...base} strokeWidth={1.8}>
      <path d="m4.5 10.5 3.6 3.6L15.8 6" />
    </svg>
  );
}

export function IconArrow({ className }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" className={className} aria-hidden="true" {...base} strokeWidth={1.6}>
      <path d="M3.5 10h13M11.5 5l5 5-5 5" />
    </svg>
  );
}

export function IconCalendar({ className }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" className={className} aria-hidden="true" {...base}>
      <rect x="2.8" y="4.2" width="14.4" height="13" rx="2.4" />
      <path d="M2.8 8.2h14.4M6.8 2.6v3M13.2 2.6v3" />
    </svg>
  );
}

export function IconPhone({ className }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" className={className} aria-hidden="true" {...base}>
      <path d="M6.6 2.9 8.2 6 6.7 7.9a10 10 0 0 0 5.4 5.4L14 11.8l3.1 1.6v2.6c0 .9-.8 1.6-1.7 1.5C8.2 16.9 3.1 11.8 2.4 4.6 2.3 3.7 3 2.9 3.9 2.9z" />
    </svg>
  );
}

export function IconMail({ className }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" className={className} aria-hidden="true" {...base}>
      <rect x="2.4" y="4.4" width="15.2" height="11.2" rx="2.2" />
      <path d="m2.9 6 6.2 4.5c.5.4 1.3.4 1.8 0L17.1 6" />
    </svg>
  );
}

export function IconPin({ className }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" className={className} aria-hidden="true" {...base}>
      <path d="M10 17.6c3.4-3.7 5.1-6.6 5.1-8.7a5.1 5.1 0 0 0-10.2 0c0 2.1 1.7 5 5.1 8.7Z" />
      <circle cx="10" cy="8.8" r="1.9" />
    </svg>
  );
}

export function IconPlay({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" fill="currentColor">
      <path d="M8.6 5.4a1 1 0 0 1 1.5-.9l8.2 5.6a1.1 1.1 0 0 1 0 1.8l-8.2 5.6a1 1 0 0 1-1.5-.9z" />
    </svg>
  );
}

export function IconMenu({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" {...base} strokeWidth={1.6}>
      <path d="M4 8h16M4 16h16" />
    </svg>
  );
}

export function IconClose({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" {...base} strokeWidth={1.6}>
      <path d="m6.5 6.5 11 11M17.5 6.5l-11 11" />
    </svg>
  );
}

export function IconFacebook({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" fill="currentColor">
      <path d="M13.5 21v-8h2.7l.4-3.1h-3.1V7.9c0-.9.25-1.5 1.55-1.5H16.7V3.6c-.3 0-1.3-.13-2.5-.13-2.45 0-4.15 1.5-4.15 4.26V9.9H7.3V13h2.75v8z" />
    </svg>
  );
}

export function IconTwitter({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" fill="currentColor">
      <path d="M17.2 3.5h2.9l-6.4 7.3 7.5 9.7h-5.9l-4.6-6-5.3 6H2.5l6.8-7.8L2.1 3.5h6l4.2 5.5zm-1 14.7h1.6L7.9 5.2H6.2z" />
    </svg>
  );
}

export function IconLinkedIn({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" fill="currentColor">
      <path d="M6.9 20.4H3.5V9.2h3.4zM5.2 7.7A2 2 0 1 1 5.2 3.6a2 2 0 0 1 0 4.1M20.5 20.4h-3.4v-5.45c0-1.3-.03-2.97-1.81-2.97-1.82 0-2.1 1.42-2.1 2.88v5.54H9.8V9.2h3.26v1.53h.05c.45-.86 1.56-1.77 3.22-1.77 3.45 0 4.09 2.27 4.09 5.22z" />
    </svg>
  );
}

/** Restrained gold divider used between major sections. */
export function Ornament({ className = "" }: IconProps) {
  return (
    <svg
      viewBox="0 0 220 16"
      className={className}
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeWidth="1"
    >
      <path d="M0 8h74" opacity="0.35" />
      <path d="M146 8h74" opacity="0.35" />
      <path d="M84 8h18M118 8h18" opacity="0.7" />
      <rect x="105.5" y="3.5" width="9" height="9" transform="rotate(45 110 8)" />
      <circle cx="79" cy="8" r="1.4" fill="currentColor" stroke="none" opacity="0.7" />
      <circle cx="141" cy="8" r="1.4" fill="currentColor" stroke="none" opacity="0.7" />
    </svg>
  );
}
