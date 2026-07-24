/* Shared with proxy.ts, which cannot import lib/auth.ts because that file is
   marked server-only and pulls in node:crypto. */
export const SESSION_COOKIE = "aaa_dash_session";
