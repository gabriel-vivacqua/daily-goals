import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/session-token";

const PUBLIC_PATHS = ["/login", "/signup"];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const session = token ? await verifySessionToken(token) : null;
  const isPublicPath = PUBLIC_PATHS.includes(pathname);

  if (!session && !isPublicPath) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  if (session && isPublicPath) {
    const url = req.nextUrl.clone();
    url.pathname = "/goals";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all routes except:
     * - api routes (handle their own auth)
     * - _next static/image
     * - favicon and other static files
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
