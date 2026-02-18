import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  // Allow same-origin requests (from the dashboard frontend itself)
  const origin = request.headers.get("origin");
  const referer = request.headers.get("referer");
  const host = request.headers.get("host");

  // If the request comes from the dashboard frontend (same origin), allow it
  if (origin && host && origin.includes(host)) {
    return NextResponse.next();
  }
  if (referer && host && referer.includes(host)) {
    return NextResponse.next();
  }
  // Modern browsers always send sec-fetch-site for fetch() requests
  const secFetchSite = request.headers.get("sec-fetch-site");
  if (secFetchSite === "same-origin") {
    return NextResponse.next();
  }

  // External requests require Bearer token auth
  const authHeader = request.headers.get("authorization");
  const expectedToken = process.env.DASHBOARD_AUTH_TOKEN;

  if (!expectedToken) {
    // If no token configured, allow access (dev mode)
    return NextResponse.next();
  }

  if (!authHeader || authHeader !== `Bearer ${expectedToken}`) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: "/api/:path*",
};
