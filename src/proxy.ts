import { NextRequest, NextResponse } from "next/server";

/**
 * IKWAS Al-Furqon — Route Protection Proxy
 *
 * Protects all /dashboard/* routes by validating the ikwas_session cookie.
 * Unauthenticated requests are redirected to /login.
 *
 * Next.js 16+ uses the "proxy" file convention (replaces "middleware").
 * Runs at the Cloudflare Edge — no Node.js APIs used.
 */
export default function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Only protect dashboard routes
  if (!pathname.startsWith("/dashboard")) {
    return NextResponse.next();
  }

  // Allow API routes to handle their own auth
  if (pathname.startsWith("/api")) {
    return NextResponse.next();
  }

  const sessionToken = req.cookies.get("ikwas_session")?.value;

  if (!sessionToken) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Token exists — allow through (full validation by page components via /api/auth/me)
  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
