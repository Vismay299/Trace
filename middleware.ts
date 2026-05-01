import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Auth gate. Public routes are explicitly allowlisted; everything else
 * needs a valid NextAuth JWT cookie. JWT verification itself happens in
 * route handlers (Node runtime); this middleware only checks for the
 * cookie's presence so it stays edge-fast.
 */

const PUBLIC_PREFIXES = [
  "/",
  "/login",
  "/signup",
  "/pricing",
  "/product",
  "/story",
  "/legal",
  "/waitlist",
  "/_dev",
  "/_next",
  "/favicon",
  "/icon",
  "/apple-icon",
  "/opengraph-image",
  "/sitemap",
  "/robots",
  "/api/auth",
  "/api/health",
  "/api/stripe/webhook",
  "/api/waitlist",
];

const SESSION_COOKIES = [
  "authjs.session-token",
  "__Secure-authjs.session-token",
  "next-auth.session-token",
  "__Secure-next-auth.session-token",
];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Allow exact landing page or any explicitly-public prefix.
  if (
    pathname === "/" ||
    PUBLIC_PREFIXES.some((p) => p !== "/" && pathname.startsWith(p))
  ) {
    return NextResponse.next();
  }

  if (process.env.TRACE_DEV_BYPASS_AUTH === "true") {
    return NextResponse.next();
  }

  const hasSession = SESSION_COOKIES.some((name) => req.cookies.has(name));
  if (!hasSession) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|svg|gif|webp|ico|woff2?|ttf)$).*)",
  ],
};
