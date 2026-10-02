import { rejectUnlessCron } from "@/lib/cron-auth";
import { previewLead } from "@/lib/odoo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* What the Odoo sync would do with one lead — create an opportunity with these
   values, or link to an existing record — without doing it. Reads Odoo and the
   leads table, writes nothing. For checking the mapping before it goes live:

     curl -H "Authorization: Bearer $CONVERSIONS_CRON_SECRET" \
       "http://127.0.0.1:3000/api/odoo/preview?leadId=123"

   origin=backfill previews the lead as the backfill would treat it, and
   nurture=1 or 0 overrides the nurture decision. */
export async function GET(request: Request) {
  const rejected = rejectUnlessCron(request);
  if (rejected) return rejected;

  const url = new URL(request.url);
  const leadId = Number(url.searchParams.get("leadId"));
  if (!Number.isInteger(leadId) || leadId <= 0) {
    return Response.json({ error: "leadId is required." }, { status: 400 });
  }

  const origin = url.searchParams.get("origin");
  const nurture = url.searchParams.get("nurture");

  try {
    const plan = await previewLead(leadId, {
      origin: origin === "backfill" || origin === "enquiry" ? origin : undefined,
      nurture: nurture === "1" ? true : nurture === "0" ? false : undefined,
    });
    return Response.json(plan, { status: "error" in plan ? 404 : 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return Response.json({ error: message }, { status: 502 });
  }
}
