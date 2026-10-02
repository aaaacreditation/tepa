import "server-only";

/* The shared secret that guards the server's own maintenance endpoints: the
   outbox drain the ten minute timer calls, and the Odoo preview. A scheduler
   cannot log in to the dashboard, hence a bearer secret rather than a session.
   Without CONVERSIONS_CRON_SECRET set every such endpoint stays closed.

   Returns the response to send when the caller is not allowed, or null when
   they are. */
export function rejectUnlessCron(request: Request): Response | null {
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
  return null;
}

/* Compares in constant time so a caller cannot recover the secret by timing
   how far the comparison got. */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}
