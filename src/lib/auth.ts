import "server-only";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/session-token";

export { SESSION_COOKIE, signSessionToken, verifySessionToken } from "@/lib/session-token";

const BCRYPT_COST = 12;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_COST);
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// A fixed hash (of a value nobody typed) at the same cost factor as real
// password hashes, so a login for a nonexistent email still pays the same
// bcrypt cost as one for a real email with a wrong password — otherwise the
// response time itself would leak which emails have accounts.
const DUMMY_HASH_FOR_TIMING = "$2b$12$Xazv2CbDTmshjOiI1QoAj.r5VsaoXN5I5QnOHvnDOUicLoIwS81e.";

export async function verifyPasswordTimingSafe(
  password: string,
  hash: string | undefined
): Promise<boolean> {
  return bcrypt.compare(password, hash ?? DUMMY_HASH_FOR_TIMING);
}

/** Public-safe user shape (no password hash). */
export type PublicUser = {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  createdAt: Date;
};

const PUBLIC_USER_SELECT = {
  id: true,
  name: true,
  email: true,
  avatarUrl: true,
  createdAt: true,
} as const;

export { PUBLIC_USER_SELECT };

/**
 * Reads the session cookie (server components, route handlers) and returns
 * the current user, or null. Also rejects a cryptographically valid token
 * whose embedded tokenVersion no longer matches the user's current
 * tokenVersion — the mechanism "log out everywhere" uses to revoke
 * already-issued tokens before they'd naturally expire.
 */
export async function getCurrentUser(): Promise<PublicUser | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const session = await verifySessionToken(token);
  if (!session) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { ...PUBLIC_USER_SELECT, tokenVersion: true },
  });
  if (!user || user.tokenVersion !== session.tokenVersion) return null;

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    avatarUrl: user.avatarUrl,
    createdAt: user.createdAt,
  };
}
