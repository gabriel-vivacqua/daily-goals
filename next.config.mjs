const isDev = process.env.NODE_ENV !== "production";

/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          // Vercel always terminates TLS for the public domain, so this is
          // safe to send unconditionally — browsers only act on it after an
          // HTTPS response anyway.
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          // This is a private household app with everyone's personal data —
          // keep it out of search indexes even if the URL leaks.
          { key: "X-Robots-Tag", value: "noindex, nofollow" },
          // Static (no nonce) so it behaves identically on every host. An
          // earlier nonce + 'strict-dynamic' version was more precise about
          // script-src, but depended on middleware's per-request nonce
          // reaching the actual render — Netlify's Next.js Runtime doesn't
          // thread that through the way plain `next start` does, which
          // silently blocked every script and broke the whole page. Static
          // 'unsafe-inline' for scripts trades that precision for working
          // the same way regardless of host; the app has no
          // dangerouslySetInnerHTML/eval and validates input with Zod
          // everywhere, so the residual risk is low.
          {
            key: "Content-Security-Policy",
            value: [
              `default-src 'self'`,
              // Dev mode needs 'unsafe-eval' too — Fast Refresh's module
              // wrapping relies on eval(), which production doesn't use.
              `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
              `style-src 'self' 'unsafe-inline'`,
              `img-src 'self' data:`,
              `font-src 'self' data:`,
              // Dev mode's HMR client holds a websocket open to the dev server.
              `connect-src 'self'${isDev ? " ws:" : ""}`,
              `object-src 'none'`,
              `base-uri 'self'`,
              `form-action 'self'`,
              `frame-ancestors 'none'`,
            ].join("; "),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
