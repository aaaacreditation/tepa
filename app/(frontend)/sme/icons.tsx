/* Line icons for /sme, drawn exactly as on the website's SMEs Accreditation
   Program page. content.ts refers to them by name. */

const PATHS = {
  // Sectors
  manufacturing: <path d="M2 20h20M4 20V9l5 3V9l5 3V4l6 4v12" />,
  it: (
    <>
      <rect x="3" y="4" width="18" height="12" rx="2" />
      <path d="M8 20h8M12 16v4" />
    </>
  ),
  healthcare: <path d="M12 5v14M5 12h14" strokeWidth={2.2} />,
  agri: <path d="M12 22c5-3 8-7 8-13V4l-8 3-8-3v5c0 6 3 10 8 13z" />,
  textile: <path d="M6 3l6 4 6-4 3 5-4 3v10H7V11L3 8z" />,
  energy: <path d="M13 2L4 14h7l-2 8 9-12h-7z" />,
  logistics: (
    <path d="M1 6h13v10H1zM14 9h5l3 3v4h-8M5 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM18 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4z" />
  ),
  construction: <path d="M2 20h20M5 20V8l7-4 7 4v12M9 20v-6h6v6" />,
  retail: <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4zM3 6h18M16 10a4 4 0 0 1-8 0" />,
  hospitality: <path d="M3 2v7a3 3 0 0 0 6 0V2M6 2v20M21 15V2a5 5 0 0 0-3 5v6z" />,
  globe: <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zM2 12h20M12 2c3 3 3 17 0 20M12 2c-3 3-3 17 0 20" />,

  // Six pillars
  finance: <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />,
  operations: <path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6" />,
  structure: (
    <>
      <rect x="9" y="2" width="6" height="5" rx="1" />
      <rect x="2" y="17" width="6" height="5" rx="1" />
      <rect x="16" y="17" width="6" height="5" rx="1" />
      <path d="M12 7v4M5 17v-4h14v4" />
    </>
  ),
  governance: (
    <>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="m9 11 2 2 4-4" />
    </>
  ),
  growth: (
    <>
      <path d="M3 17l6-6 4 4 8-8" />
      <path d="M14 7h7v7" />
    </>
  ),
  improvement: (
    <>
      <path d="M21 3v6h-6M3 21v-6h6" />
      <path d="M3.5 12a8.5 8.5 0 0 1 14.3-6.2L21 9M20.5 12a8.5 8.5 0 0 1-14.3 6.2L3 15" />
    </>
  ),

  // Process
  application: (
    <>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6M9 13h6M9 17h4" />
    </>
  ),
  documents: <path d="M3 7a2 2 0 0 1 2-2h4l2 3h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />,
  assessment: (
    <>
      <rect x="6" y="4" width="12" height="17" rx="2" />
      <path d="M9 4h6v3H9z" />
      <path d="m9.5 14 2 2 3.5-4.5" />
    </>
  ),
  feedback: (
    <>
      <path d="M21 11.5a7.5 7.5 0 0 1-7.5 7.5H8l-5 3.5V11.5A7.5 7.5 0 0 1 10.5 4h3A7.5 7.5 0 0 1 21 11.5z" />
      <path d="M8.5 11.5h.01M12 11.5h.01M15.5 11.5h.01" />
    </>
  ),
  decision: (
    <>
      <path d="m13.5 12.5-8 8a1.77 1.77 0 0 1-2.5-2.5l8-8" />
      <path d="m15.5 15.5 5.5-5.5M8.5 8.5 14 3M8 9l7 7M20 11l-7-7" />
    </>
  ),

  // Buttons
  download: <path d="M12 3v12M7 11l5 5 5-5M4 21h16" />,
} as const;

export type SmeIconName = keyof typeof PATHS;

export function LineIcon({ name }: { name: SmeIconName }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {PATHS[name]}
    </svg>
  );
}
