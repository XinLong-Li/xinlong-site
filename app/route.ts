import type { NextRequest } from "next/server";

export function GET(request: NextRequest) {
  const accept = request.headers.get("accept-language")?.toLowerCase() || "";
  const prefersEn = accept.startsWith("en");
  const target = prefersEn ? "/en" : "/zh";
  return Response.redirect(new URL(target, request.url));
}