import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Forces HTTPS in production (308 redirect). Local hosts are exempt so
 * `next dev` over plain http keeps working. Relies on the standard
 * x-forwarded-proto header set by Vercel/Supabase/other proxies.
 */
export function middleware(req: NextRequest) {
  if (process.env.NODE_ENV !== "production") return NextResponse.next();

  const host = req.headers.get("host") ?? "";
  const isLocal = /^(localhost|127\.0\.0\.1|\[::1\]|.*\.local)(:\d+)?$/.test(host);
  const proto = req.headers.get("x-forwarded-proto");
  if (proto === "http" && !isLocal) {
    const url = req.nextUrl.clone();
    url.protocol = "https:";
    return NextResponse.redirect(url, 308);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
