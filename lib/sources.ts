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

/* The landing page that existed before there was a registry. Its Google Ads
   configuration keeps the unsuffixed variable names it has always used
   (GOOGLE_ADS_ACTION_LEAD); every later page reads only its own suffixed ones
   (GOOGLE_ADS_ACTION_LEAD_CLINIC). See lib/conversions.ts. */
export const DEFAULT_SOURCE = "tepa";

export function getSource(key: string): LandingPageSource | null {
  return SOURCES[key] ?? null;
}
