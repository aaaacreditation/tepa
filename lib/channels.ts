/* Which advertising channel a lead arrived through.

   The dashboard's own "source" is the landing page (/tepa, /healthcare,
   /clinic). This is the other axis: the ad platform that paid for the click,
   so Google and Meta can be compared instead of pooled.

   Two signals carry it, and they disagree often enough to need an order:

   - The utm_source tag, set by the campaign on the click that brought this
     visit. It follows the newest click (see mergeAttribution), so it describes
     the visit rather than the visitor's history.
   - The click identifier — gclid / gbraid / wbraid for Google, fbclid for
     Meta. These survive in the attribution cookie for up to 90 days, and each
     platform's id is only replaced by a newer click from the same platform, so
     a lead can carry both at once.

   Hence: a tag wins over a click id, because a stale gclid next to
   utm_source=facebook means the visitor clicked a Google ad weeks ago and a
   Meta ad today. Only when nothing is tagged does the click id decide, which
   is what currently identifies Google Ads traffic here at all — the Meta ads
   tag every URL, the Google campaigns tag none of them.

   Worth knowing about fbclid: Facebook appends it to any link clicked on the
   platform, paid or not. A lead landing here with an fbclid and no utm tags
   came from Meta, but not necessarily from an ad — which is why the tab is
   labelled "Meta" and not "Meta Ads", and why utm_medium is shown per lead. */

export const CHANNELS = ["google", "meta", "other"] as const;
export type Channel = (typeof CHANNELS)[number];

export const CHANNEL_LABEL: Record<Channel, string> = {
  google: "Google Ads",
  meta: "Meta",
  other: "Direct & other",
};

/* Short forms for the per lead badge, where the column is narrow and the row
   already says where it landed. */
export const CHANNEL_SHORT: Record<Channel, string> = {
  google: "Google",
  meta: "Meta",
  other: "Direct",
};

/* Each platform's own blue, held back to a tint that survives beside the navy
   stage ramp: Google's #4285f4 and Meta's #0866ff read as brand marks at a
   glance, and "other" stays deliberately neutral so it never competes. */
export const CHANNEL_COLOR: Record<Channel, string> = {
  google: "#3a76b2",
  meta: "#0866ff",
  other: "#93a1b0",
};

/* The tab strip: every channel plus the unfiltered view. */
export const CHANNEL_FILTERS = ["all", ...CHANNELS] as const;
export type ChannelFilter = (typeof CHANNEL_FILTERS)[number];

export function isChannelFilter(value: string): value is ChannelFilter {
  return (CHANNEL_FILTERS as readonly string[]).includes(value);
}

/* utm_source values each platform is known to arrive under. Google Ads writes
   whatever the tracking template says, so the aliases people actually type are
   all here; Meta's own tag says "facebook" even for Instagram placements. */
const GOOGLE_SOURCES = [
  "google",
  "google-ads",
  "googleads",
  "google_ads",
  "adwords",
  "youtube",
  "gdn",
  "dv360",
] as const;

const META_SOURCES = [
  "meta",
  "facebook",
  "fb",
  "facebook-ads",
  "instagram",
  "ig",
  "messenger",
  "audience_network",
] as const;

export type ChannelSignals = {
  gclid: string;
  gbraid: string;
  wbraid: string;
  fbclid: string;
  utmSource: string;
};

export function channelOf(lead: ChannelSignals): Channel {
  const tag = lead.utmSource.trim().toLowerCase();
  if ((META_SOURCES as readonly string[]).includes(tag)) return "meta";
  if ((GOOGLE_SOURCES as readonly string[]).includes(tag)) return "google";
  if (lead.gclid || lead.gbraid || lead.wbraid) return "google";
  if (lead.fbclid) return "meta";
  return "other";
}

/* ==========================================================================
   The same rule, in SQL
   ========================================================================== */

/* Counting by channel in the browser would mean shipping every lead in the
   range to do it, so the totals, the daily series and the country breakdown
   classify in the database instead. This expression is channelOf() written for
   Postgres and the two must stay in step — change one, change both.

   Bare column names: every query that uses this reads FROM leads, and
   lead_events has no column of any of these names, so the unqualified
   references resolve correctly even in the joined queries. */
const quoted = (values: readonly string[]) => values.map((v) => `'${v}'`).join(", ");

export const CHANNEL_SQL = `CASE
  WHEN lower(utm_source) IN (${quoted(META_SOURCES)})   THEN 'meta'
  WHEN lower(utm_source) IN (${quoted(GOOGLE_SOURCES)}) THEN 'google'
  WHEN gclid <> '' OR gbraid <> '' OR wbraid <> ''      THEN 'google'
  WHEN fbclid <> ''                                     THEN 'meta'
  ELSE 'other'
END`;

/* An AND fragment for the WHERE clause, or nothing for the unfiltered tab.
   The value is interpolated rather than bound because it also has to work
   inside the daily series CTE, and it is safe to: it can only be one of the
   literals in CHANNELS, checked by isChannelFilter before it gets here. */
export function channelClause(channel: ChannelFilter): string {
  return channel === "all" ? "" : `AND (${CHANNEL_SQL}) = '${channel}'`;
}
