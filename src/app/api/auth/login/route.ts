import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyPasswordTimingSafe, signSessionToken, SESSION_COOKIE } from "@/lib/auth";
import { loginSchema } from "@/lib/validation";
import { clientIp, rateLimit } from "@/lib/rateLimit";

export async function POST(req: NextRequest) {
  const { ok, retryAfterSeconds } = rateLimit(`login:${clientIp(req)}`, {
    limit: 10,
    windowMs: 10 * 60 * 1000,
  });
  if (!ok) {
    return NextResponse.json(
      { error: "Too many attempts. Try again later." },
      { status: 429, headers: { "Retry-After": String(retryAfterSeconds) } }
    );
  }

  const body = await req.json().catch(() => null);
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }
  const { email, password } = parsed.data;

  // Always run the bcrypt comparison, even for a nonexistent email (against
  // a fixed dummy hash) — otherwise a real account short-circuits into a
  // slower response than a nonexistent one, and the timing difference alone
  // reveals which emails have accounts.
  const user = await prisma.user.findUnique({ where: { email } });
  const passwordOk = await verifyPasswordTimingSafe(password, user?.passwordHash);
  if (!user || !passwordOk) {
    return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
  }

  const token = await signSessionToken(user.id, user.tokenVersion);
  const res = NextResponse.json({
    user: { id: user.id, name: user.name, email: user.email, createdAt: user.createdAt },
  });
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return res;
}
