/* The dashboard has two filters — the date range and the ad channel — and both
   live in the query string, so each control has to carry the other's value or
   picking one would silently reset the other. Defaults are left out of the URL
   so the plain page path stays the canonical "everything, last 30 days". */

export const DEFAULT_RANGE = "30";
export const DEFAULT_CHANNEL = "all";

export type DashboardFilters = { range: string; channel: string };

export function filterHref(basePath: string, filters: DashboardFilters): string {
  const params = new URLSearchParams();
  if (filters.range !== DEFAULT_RANGE) params.set("range", filters.range);
  if (filters.channel !== DEFAULT_CHANNEL) params.set("channel", filters.channel);
  const query = params.toString();
  return query ? `${basePath}?${query}` : basePath;
}
