import { SignJWT, jwtVerify } from "jose";

/**
 * Edge-safe session token helpers (no Prisma, no next/headers) so they can
 * be imported from middleware.ts, which runs in the Edge runtime.
 */

export const SESSION_COOKIE = "gt_session";
const SESSION_DURATION_SECONDS = 60 * 60 * 24 * 30; // 30 days

const DEV_DEFAULT_SECRET = "dev-only-secret-change-me-please-1234567890";

function getSecretKey() {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error("SESSION_SECRET is not set");
  if (process.env.NODE_ENV === "production" && secret === DEV_DEFAULT_SECRET) {
    throw new Error(
      "SESSION_SECRET is still set to the local dev default — set a real secret in production."
    );
  }
  return new TextEncoder().encode(secret);
}

export async function signSessionToken(userId: string, tokenVersion: number): Promise<string> {
  return new SignJWT({ userId, tokenVersion })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DURATION_SECONDS}s`)
    .sign(getSecretKey());
}

export async function verifySessionToken(
  token: string
): Promise<{ userId: string; tokenVersion: number } | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    if (typeof payload.userId !== "string" || typeof payload.tokenVersion !== "number") {
      return null;
    }
    return { userId: payload.userId, tokenVersion: payload.tokenVersion };
  } catch {
    return null;
  }
}
