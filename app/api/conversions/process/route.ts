import { drainConversions } from "@/lib/conversions";
import { rejectUnlessCron } from "@/lib/cron-auth";
import { drainOdoo } from "@/lib/odoo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* Drains the conversion outbox, and the Odoo CRM outbox after it.

   The after() hooks on the enquiry route and the status action already send on
   the happy path. This exists for the unhappy one: Google returning 5xx, an
   access token failing to refresh, Odoo being down, or the process being torn
   down mid send. The server's ten minute timer points at it; curl it by hand
   after fixing credentials.

   Guarded by a shared secret rather than the dashboard session so a scheduler
   can call it without logging in; see lib/cron-auth.ts. An open endpoint would
   let anyone drive spend reporting. */

/* Each Odoo row costs a few round trips, so a run takes at most this many and
   stays well inside the timer's two minute curl timeout. A backlog clears over
   a few runs. */
const ODOO_PER_RUN = 25;

export async function POST(request: Request) {
  const rejected = rejectUnlessCron(request);
  if (rejected) return rejected;

  const url = new URL(request.url);
  const requested = Number(url.searchParams.get("limit"));
  const limit = Number.isFinite(requested)
    ? Math.min(200, Math.max(1, Math.floor(requested)))
    : 50;

  let conversions: Awaited<ReturnType<typeof drainConversions>>;
  try {
    conversions = await drainConversions(limit);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[conversions/process] drain failed", error);
    return Response.json({ ok: false, error: message }, { status: 500 });
  }

  /* The two outboxes fail independently: an Odoo outage must not turn a run
     that sent its conversions into an error. */
  let odoo: Awaited<ReturnType<typeof drainOdoo>> | { error: string };
  try {
    odoo = await drainOdoo(Math.min(limit, ODOO_PER_RUN));
  } catch (error) {
    console.error("[conversions/process] odoo drain failed", error);
    odoo = { error: error instanceof Error ? error.message : String(error) };
  }

  return Response.json({ ok: true, ...conversions, odoo });
}
