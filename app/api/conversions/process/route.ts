import { drainConversions } from "@/lib/conversions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* Drains the conversion outbox.

   The after() hooks on the enquiry route and the status action already send on
   the happy path. This exists for the unhappy one: Google returning 5xx, an
   access token failing to refresh, or the process being torn down mid send.
   Point a scheduler at it, or curl it by hand after fixing credentials.

   Guarded by a shared secret rather than the dashboard session so a scheduler
   can call it without logging in. Without CONVERSIONS_CRON_SECRET set it stays
   closed, because an open endpoint would let anyone drive spend reporting. */
export async function POST(request: Request) {
  const secret = process.env.CONVERSIONS_CRON_SECRET;
  if (!secret) {
    return Response.json(
      { error: "CONVERSIONS_CRON_SECRET is not set, so this endpoint is disabled." },
      { status: 503 },
    );
  }

  const header = request.headers.get("authorization") ?? "";
  const provided = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!timingSafeEqual(provided, secret)) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }

  const url = new URL(request.url);
  const requested = Number(url.searchParams.get("limit"));
  const limit = Number.isFinite(requested)
    ? Math.min(200, Math.max(1, Math.floor(requested)))
    : 50;

  try {
    const result = await drainConversions(limit);
    return Response.json({ ok: true, ...result });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[conversions/process] drain failed", error);
    return Response.json({ ok: false, error: message }, { status: 500 });
  }
}

/* Compares in constant time so a caller cannot recover the secret by timing
   how far the comparison got. */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}
