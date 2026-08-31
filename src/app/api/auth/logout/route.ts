import { NextResponse } from "next/server";
import { SESSION_COOKIE } from "@/lib/auth";
import { withErrorHandling } from "@/lib/apiRoute";

export const POST = withErrorHandling(async () => {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, "", { path: "/", maxAge: 0 });
  return res;
});
