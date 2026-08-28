import "server-only";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { eq, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { adminUsers, type AdminUser } from "@/db/schema";
import { authSecret } from "@/lib/env";

const COOKIE_NAME = "gv_session";
const SESSION_DURATION = "7d";

export type SessionPayload = {
  sub: string; // admin_users.id, as a string (JWT convention)
  email: string;
  name: string;
};

/**
 * A signed, httpOnly JWT cookie — no session table. Right-sized for a single
 * owner account: nothing to garbage-collect. The token itself carries no
 * password material, so changing the password does not invalidate it by
 * itself — that enforcement lives in `getVerifiedSession()` below, which
 * compares the token's issue time against the account's `updatedAt`.
 */
export async function createSession(user: Pick<AdminUser, "id" | "email" | "name">) {
  const token = await new SignJWT({ email: user.email, name: user.name })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(String(user.id))
    .setIssuedAt()
    .setExpirationTime(SESSION_DURATION)
    .sign(authSecret());

  const store = await cookies();
  store.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function destroySession() {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}

/**
 * Verifies the cookie's signature and expiry only — does not hit the
 * database. Fast enough for the Edge middleware's first-pass gate, but it
 * cannot detect a deleted account or a since-rotated password; use
 * `getVerifiedSession()` wherever that distinction actually matters (every
 * admin page render already pays for a database round trip, so there is no
 * reason to accept the weaker guarantee there).
 */
export async function getSession(): Promise<SessionPayload | null> {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, authSecret());
    if (!payload.sub || typeof payload.email !== "string") return null;
    return { sub: payload.sub, email: payload.email, name: String(payload.name ?? "") };
  } catch {
    // Expired, tampered, or signed with a since-rotated AUTH_SECRET.
    return null;
  }
}

/**
 * The authoritative check. Same signature verification as `getSession()`,
 * plus two things a JWT alone can never know: whether the account still
 * exists, and whether it changed *after* this particular token was issued.
 * A password change (or any other account update) bumps `admin_users.updatedAt`,
 * so every token signed before that moment stops working here immediately —
 * this is what actually delivers the "changing the password logs old
 * sessions out" property, rather than just asserting it in a comment.
 */
export async function getVerifiedSession(): Promise<SessionPayload | null> {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (!token) return null;

  let payload: { sub?: string; email?: unknown; name?: unknown; iat?: number };
  try {
    ({ payload } = await jwtVerify(token, authSecret()));
  } catch {
    return null;
  }
  if (!payload.sub || typeof payload.email !== "string" || !payload.iat) return null;

  const db = getDb();
  const [user] = await db
    .select({ updatedAt: adminUsers.updatedAt })
    .from(adminUsers)
    .where(eq(adminUsers.id, Number(payload.sub)))
    .limit(1);
  if (!user) return null; // account deleted since this token was issued

  // JWT `iat` is whole-second precision; `updatedAt` carries milliseconds.
  // Comparing them raw means a session reissued in the very same second as
  // the write it is reacting to (changing your own password, which reissues
  // the token immediately after) can floor to a second-boundary that reads
  // as "older" than a sub-second-later updatedAt, logging out the one
  // session the reissue exists to keep alive. Floor both to the second the
  // JWT can actually represent before comparing.
  const issuedAtSec = payload.iat;
  const updatedAtSec = Math.floor(user.updatedAt.getTime() / 1000);
  if (issuedAtSec < updatedAtSec) return null; // account changed since

  return { sub: payload.sub, email: payload.email, name: String(payload.name ?? "") };
}

export type AuthResult =
  | { ok: true }
  | { ok: false; error: string };

/**
 * Verifies credentials and, on success, issues the session cookie.
 * The email lookup is case-insensitive to match the functional unique index
 * on admin_users, and the error is identical for "no such account" and
 * "wrong password" so a login form never confirms which emails exist.
 */
export async function signIn(email: string, password: string): Promise<AuthResult> {
  const db = getDb();
  const [user] = await db
    .select()
    .from(adminUsers)
    .where(sql`lower(${adminUsers.email}) = lower(${email})`)
    .limit(1);

  const GENERIC_ERROR = "Email or password is incorrect.";
  if (!user) {
    // Hash something anyway, so a valid vs. invalid email cannot be timed apart.
    await bcrypt.hash(password || "x", 12);
    return { ok: false, error: GENERIC_ERROR };
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) return { ok: false, error: GENERIC_ERROR };

  await createSession(user);
  await db
    .update(adminUsers)
    .set({ lastLoginAt: new Date() })
    .where(eq(adminUsers.id, user.id));

  return { ok: true };
}

export async function changePassword(
  userId: number,
  currentPassword: string,
  newPassword: string,
): Promise<AuthResult> {
  if (newPassword.length < 12) {
    return { ok: false, error: "New password must be at least 12 characters." };
  }
  const db = getDb();
  const [user] = await db.select().from(adminUsers).where(eq(adminUsers.id, userId)).limit(1);
  if (!user) return { ok: false, error: "Account not found." };

  const valid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!valid) return { ok: false, error: "Current password is incorrect." };

  const passwordHash = await bcrypt.hash(newPassword, 12);
  // updatedAt is not just bookkeeping here — getVerifiedSession() uses it as
  // the revocation watermark, so this is the line that actually logs out
  // every session issued before the password changed.
  await db
    .update(adminUsers)
    .set({ passwordHash, updatedAt: new Date() })
    .where(eq(adminUsers.id, userId));
  return { ok: true };
}
