/* Registry of landing pages that feed the leads dashboard.
   Add an entry here when a new landing page joins the project and its
   dashboard view appears automatically at /dashboard/<key>. */

export type LandingPageSource = {
  key: string;
  label: string;
  name: string;
  path: string;
};

export const SOURCES: Record<string, LandingPageSource> = {
  tepa: {
    key: "tepa",
    label: "TEPA",
    name: "Training & Education Provider Accreditation",
    path: "/tepa",
  },
  healthcare: {
    key: "healthcare",
    label: "Healthcare",
    name: "Healthcare Accreditation for Hospitals & Clinics",
    path: "/healthcare",
  },
  clinic: {
    key: "clinic",
    label: "Clinic",
    name: "Clinic Accreditation Readiness Assessment",
    path: "/clinic",
  },
};

export function getSource(key: string): LandingPageSource | null {
  return SOURCES[key] ?? null;
}
