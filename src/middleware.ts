import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";

/**
 * Guards /admin/* at the edge, before any admin page or layout runs.
 *
 * Verifies the JWT signature only — no database round trip in middleware,
 * which the Edge runtime doesn't support for our Neon HTTP client anyway.
 * The full session (email, name) is re-read from the cookie inside each
 * admin page via `getSession()`, which is cheap because it is the same
 * verify call against an already-fetched cookie.
 */
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (pathname === "/admin/login") return NextResponse.next();

  const token = req.cookies.get("gv_session")?.value;
  const secret = process.env.AUTH_SECRET;

  const authenticated =
    Boolean(token) &&
    Boolean(secret) &&
    (await jwtVerify(token!, new TextEncoder().encode(secret))
      .then(() => true)
      .catch(() => false));

  if (!authenticated) {
    const url = req.nextUrl.clone();
    url.pathname = "/admin/login";
    url.searchParams.set("from", pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
