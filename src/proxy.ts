import { NextRequest, NextResponse } from "next/server";

/**
 * IKWAS Al-Furqon — Route Protection Middleware
 * 
 * Protects all /dashboard/* routes by validating the ikwas_session cookie
 * against the D1 database. Unauthenticated requests are redirected to /login.
 * 
 * Note: Middleware in Next.js + Cloudflare Workers runs at the edge.
 * We do a lightweight cookie check here; full DB validation is done in each API route.
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
