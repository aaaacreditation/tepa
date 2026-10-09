import { after } from "next/server";
import { cleanMetaEventId } from "@/lib/meta-identity";
import {
  cleanOpaque,
  OpenAICapiError,
  openaiIdsFromCookies,
  readOpenAIConfig,
  sendOpenAIEvent,
} from "@/lib/openai-capi";
import { getSource } from "@/lib/sources";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* The server copy of contents_viewed for ChatGPT ads. The page fires the
   browser copy through the pixel and posts the same event id here, so OpenAI
   keeps one of the two. A page view has no lead row, so it cannot go through
   the conversions outbox like the enquiry does; it is sent once, after the
   response, and a failure is logged rather than retried. A missed view is
   cheap; a missed lead is not.

   Only contents_viewed is accepted. This route needs no login, and letting it
   report lead_created would let anyone post fake conversions. */

const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://campaigns.aaa-accreditation.org"
).replace(/\/$/, "");

const PATH_RE = /^\/[A-Za-z0-9/_-]{0,120}$/;

/* The same small in memory throttle as the enquiry routes. A visit sends one
   view, so the ceiling is loose; it is there to stop the route being used to
   push traffic at OpenAI. */
const HITS = new Map<string, number[]>();
const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 20;

function throttled(ip: string) {
  const now = Date.now();
  const recent = (HITS.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  recent.push(now);
  HITS.set(ip, recent);
  if (HITS.size > 5000) HITS.clear();
  return recent.length > MAX_PER_WINDOW;
}

export async function POST(request: Request) {
  const openai = readOpenAIConfig();
  if (!openai.ok) return new Response(null, { status: 204 });

  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    request.headers.get("x-real-ip") ??
    "unknown";
  if (throttled(ip)) return new Response(null, { status: 429 });

  let payload: Record<string, unknown>;
  try {
    payload = await request.json();
  } catch {
    return new Response(null, { status: 400 });
  }

  const eventId = cleanMetaEventId(payload.eventId);
  const source = getSource(typeof payload.source === "string" ? payload.source : "");
  if (!eventId || !source) return new Response(null, { status: 400 });

  const path =
    typeof payload.path === "string" && PATH_RE.test(payload.path) ? payload.path : source.path;

  /* The pixel's cookies when it has run; on a first visit the SDK may not have
     written them yet, so the click reference falls back to the one the page
     read off its own URL. */
  const ids = openaiIdsFromCookies(request.headers.get("cookie"));
  const oppref = ids.oppref || cleanOpaque(typeof payload.oppref === "string" ? payload.oppref : "");
  const clientUserAgent = (request.headers.get("user-agent") ?? "").slice(0, 512);

  after(async () => {
    try {
      await sendOpenAIEvent(openai.config, {
        type: "contents_viewed",
        id: eventId,
        eventTime: new Date(),
        sourceUrl: `${SITE_URL}${path}`,
        oppref,
        user: {
          obref: ids.obref,
          clientIp: ip === "unknown" ? "" : ip,
          clientUserAgent,
        },
        data: {
          type: "contents",
          contents: [{ id: source.key, name: source.name, content_type: "page" }],
        },
      });
    } catch (error) {
      const message = error instanceof OpenAICapiError ? error.message : String(error);
      console.error(`[openai/view] ${source.key}: ${message}`);
    }
  });

  return new Response(null, { status: 204 });
}
