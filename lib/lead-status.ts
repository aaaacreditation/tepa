/* Client safe pipeline constants shared by the dashboard UI and the server
   data layer. Stage colors are an ordinal ramp on the brand navy, validated
   for monotone lightness and CVD separation against the white card surface. */

export const LEAD_STATUSES = ["lead", "mql", "sql", "customer"] as const;
export type LeadStatus = (typeof LEAD_STATUSES)[number];

export const STATUS_LABEL: Record<LeadStatus, string> = {
  lead: "Lead",
  mql: "MQL",
  sql: "SQL",
  customer: "Customer",
};

export const STAGE_COLORS: Record<LeadStatus, string> = {
  lead: "#6d9ccb",
  mql: "#3a76b2",
  sql: "#1a4c81",
  customer: "#0b2440",
};

export function isLeadStatus(value: string): value is LeadStatus {
  return (LEAD_STATUSES as readonly string[]).includes(value);
}
