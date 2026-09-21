import { DEFAULT_RANGE } from "./ranges";

/* The dashboard has two filters — the date range and the ad channel — and both
   live in the query string, so each control has to carry the other's value or
   picking one would silently reset the other. Defaults are left out of the URL
   so the plain page path stays the canonical "everything, last 30 days".

   A custom range carries its two days instead of a key, which also makes the
   URL the whole state: a link to one pasted into chat opens on the same
   window it was read on. */

export { DEFAULT_RANGE };
export const DEFAULT_CHANNEL = "all";

export type DashboardFilters = {
  range: string;
  channel: string;
  from?: string;
  to?: string;
};

export function filterHref(basePath: string, filters: DashboardFilters): string {
  const params = new URLSearchParams();
  const custom = filters.range === "custom";

  if (filters.range !== DEFAULT_RANGE) params.set("range", filters.range);
  if (custom && filters.from) params.set("from", filters.from);
  if (custom && filters.to) params.set("to", filters.to);
  if (filters.channel !== DEFAULT_CHANNEL) params.set("channel", filters.channel);

  const query = params.toString();
  return query ? `${basePath}?${query}` : basePath;
}
