import { rejectUnlessCron } from "@/lib/cron-auth";
import { previewOdooReconcile, STAGE_TO_STATUS } from "@/lib/odoo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* How the dashboard and Odoo compare today, and what aligning every status
   with its Odoo stage once would change — without changing anything. Reads
   Odoo and the leads table only:

     curl -H "Authorization: Bearer $CONVERSIONS_CRON_SECRET" \
       "http://127.0.0.1:3000/api/odoo/stages"

   The ongoing sync, which follows stage changes from now on, runs on the drain
   timer; see pullOdooStages. */
export async function GET(request: Request) {
  const rejected = rejectUnlessCron(request);
  if (rejected) return rejected;

  try {
    const preview = await previewOdooReconcile();
    return Response.json(
      { mapping: STAGE_TO_STATUS, ...preview },
      { status: "error" in preview ? 503 : 200 },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return Response.json({ error: message }, { status: 502 });
  }
}
