import type { NextRequest } from "next/server";

export function GET(request: NextRequest, { params }: { params: { unscoped: string[] } }) {
  const path = "/" + (params.unscoped?.join("/") || "");
  // Allow internal and API paths to pass
  if (path.startsWith("/_next") || path.startsWith("/api")) {
    return new Response(null, { status: 404 }); // let Next handle normal routing
  }

  // If already language-scoped, do nothing (404 to defer to real routes)
  if (path.startsWith("/en/") || path === "/en" || path.startsWith("/zh/") || path === "/zh") {
    return new Response(null, { status: 404 });
  }

  const accept = request.headers.get("accept-language")?.toLowerCase() || "";
  const prefersEn = accept.startsWith("en");
  const prefix = prefersEn ? "/en" : "/zh";
  const target = path === "/" ? prefix : `${prefix}${path}`;
  return Response.redirect(new URL(target, request.url));
}