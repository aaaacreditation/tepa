import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE } from "./lib/session-constants";

/* Optimistic gate only: it checks that a session cookie exists so anonymous
   visitors bounce to the login screen early. The cookie signature is verified
   in the dashboard layout and in every server action. */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasCookie = Boolean(request.cookies.get(SESSION_COOKIE)?.value);

  /* Never bounce the login page itself: the cookie may exist but be expired
     or invalid, and only the server side session check can tell. Redirecting
     here on cookie presence alone would loop against the layout guard. */
  if (pathname === "/dashboard/login") {
    return NextResponse.next();
  }

  if (!hasCookie) {
    return NextResponse.redirect(new URL("/dashboard/login", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: "/dashboard/:path*",
};
