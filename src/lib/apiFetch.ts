"use client";

/**
 * fetch wrapper for authenticated API calls. A session cookie can be
 * cryptographically valid (so middleware treats the visitor as logged in
 * and lets protected pages render) while pointing at a user that no longer
 * exists in the database — e.g. the dev DB was reset but the browser kept
 * an old cookie. Route handlers correctly 401 in that case, but left alone
 * the page just sits there broken (no nav, failed fetches). Clear the
 * stale cookie and bounce to /login instead.
 */
export async function apiFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const res = await fetch(input, init);
  if (res.status === 401) {
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
    window.location.href = "/login";
  }
  return res;
}
