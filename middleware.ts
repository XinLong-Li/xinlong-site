import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  // Allow Next.js internals and API
  if (pathname.startsWith("/_next") || pathname.startsWith("/api")) {
    return NextResponse.next();
  }

  // Already language-scoped
  if (pathname.startsWith("/en") || pathname.startsWith("/zh")) {
    return NextResponse.next();
  }

  // Redirect root or legacy paths to preferred language
  const accept = request.headers.get("accept-language") || "";
  const prefersEn = accept.toLowerCase().startsWith("en");
  const langPrefix = prefersEn ? "/en" : "/zh";
  const url = request.nextUrl.clone();
  url.pathname = pathname === "/" ? langPrefix : `${langPrefix}${pathname}`;
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/", "/((?!_next|api).*)"],
};