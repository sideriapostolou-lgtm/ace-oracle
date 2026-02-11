import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_PATHS = [
  "/gate",
  "/api",
  "/success",
  "/login",
  "/_next",
  "/favicon.ico",
];

export function middleware(request: NextRequest): NextResponse {
  const { pathname } = request.nextUrl;

  // Allow public paths
  for (const path of PUBLIC_PATHS) {
    if (pathname.startsWith(path)) {
      // If user has access and visits /gate, redirect to dashboard
      if (pathname === "/gate") {
        const accessCookie = request.cookies.get("ace_access");
        if (accessCookie?.value === "granted") {
          return NextResponse.redirect(new URL("/", request.url));
        }
      }
      return NextResponse.next();
    }
  }

  // Paid users pass through
  const accessCookie = request.cookies.get("ace_access");
  if (accessCookie?.value === "granted") {
    return NextResponse.next();
  }

  // Trial users: allow through — client-side TrialProvider handles gating
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
