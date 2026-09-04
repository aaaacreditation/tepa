import Link from "next/link";
import {
  CHANNELS,
  CHANNEL_COLOR,
  CHANNEL_LABEL,
  type Channel,
  type ChannelFilter,
} from "@/lib/channels";
import { filterHref } from "./filter-href";

/* Splits the page by the ad platform that produced the lead. Every number
   below it — the tiles, the chart, the pipeline, the table — is scoped to the
   selected tab, so Google and Meta can be read side by side rather than as one
   blended total.

   The counts are always the full range, so a tab shows what it holds before it
   is opened and an empty channel is visibly empty rather than missing. */
export function ChannelTabs({
  current,
  basePath,
  range,
  counts,
  total,
}: {
  current: ChannelFilter;
  basePath: string;
  range: string;
  counts: Record<Channel, number>;
  total: number;
}) {
  const tabs: Array<{ key: ChannelFilter; label: string; count: number; color?: string }> = [
    { key: "all", label: "All leads", count: total },
    ...CHANNELS.map((channel) => ({
      key: channel as ChannelFilter,
      label: CHANNEL_LABEL[channel],
      count: counts[channel],
      color: CHANNEL_COLOR[channel],
    })),
  ];

  return (
    <nav className="dash-tabs" aria-label="Traffic channel">
      {tabs.map((tab) => {
        const active = current === tab.key;
        return (
          <Link
            key={tab.key}
            href={filterHref(basePath, { range, channel: tab.key })}
            className="dash-tab"
            data-active={active}
            aria-current={active ? "page" : undefined}
          >
            {tab.color && (
              <span
                aria-hidden="true"
                className="h-2 w-2 rounded-full"
                style={{ background: tab.color }}
              />
            )}
            {tab.label}
            <span className="dash-tab-count">{tab.count.toLocaleString("en-US")}</span>
          </Link>
        );
      })}
    </nav>
  );
}
