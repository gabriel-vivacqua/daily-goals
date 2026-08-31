import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser, signSessionToken, SESSION_COOKIE } from "@/lib/auth";

/**
 * Invalidates every session token issued for this user — including the
 * stolen/lost-device scenario — by bumping tokenVersion, which every
 * request now checks against (see getCurrentUser). The current device is
 * re-issued a fresh token at the new version so it stays logged in; every
 * other device's cookie stops working on its next request.
 */
export async function POST() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: { tokenVersion: { increment: 1 } },
    select: { tokenVersion: true },
  });

  const token = await signSessionToken(user.id, updated.tokenVersion);
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return res;
}
