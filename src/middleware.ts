import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/session-token";

const PUBLIC_PATHS = ["/login", "/signup"];

const isDev = process.env.NODE_ENV !== "production";

function buildCsp(nonce: string): string {
  return [
    `default-src 'self'`,
    // 'strict-dynamic' lets Next's own nonce'd bootstrap script load its
    // chunks without listing every hash; browsers that honor it ignore the
    // extra source-list entries, and the 'nonce-...' term is still what
    // authorizes the inline scripts Next injects for hydration data.
    // Dev mode also needs 'unsafe-eval' — Fast Refresh's module wrapping
    // relies on eval() — which production doesn't use.
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isDev ? " 'unsafe-eval'" : ""}`,
    // Tailwind emits some inline style attributes at runtime; there's no
    // practical nonce path for those, so style-src stays looser than script-src.
    `style-src 'self' 'unsafe-inline'`,
    `img-src 'self' data:`,
    `font-src 'self' data:`,
    // Dev mode's HMR client holds a websocket open to the dev server.
    `connect-src 'self'${isDev ? " ws:" : ""}`,
    `object-src 'none'`,
    `base-uri 'self'`,
    `form-action 'self'`,
    `frame-ancestors 'none'`,
    ...(isDev ? [] : [`upgrade-insecure-requests`]),
  ].join("; ");
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const session = token ? await verifySessionToken(token) : null;
  const isPublicPath = PUBLIC_PATHS.includes(pathname);

  const nonce = crypto.randomUUID().replace(/-/g, "");
  const csp = buildCsp(nonce);

  // Forward the nonce to Server Components via a request header (read with
  // headers() in layout.tsx) and set the CSP on the response — both need
  // the same value for Next's own injected scripts to be authorized.
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-nonce", nonce);

  function withCsp(res: NextResponse) {
    res.headers.set("Content-Security-Policy", csp);
    return res;
  }

  if (!session && !isPublicPath) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return withCsp(NextResponse.redirect(url));
  }

  if (session && isPublicPath) {
    const url = req.nextUrl.clone();
    url.pathname = "/goals";
    url.search = "";
    return withCsp(NextResponse.redirect(url));
  }

  return withCsp(NextResponse.next({ request: { headers: requestHeaders } }));
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
