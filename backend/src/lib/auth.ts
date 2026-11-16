import bcrypt from 'bcryptjs'
import { eq } from 'drizzle-orm'
import type { Request, RequestHandler, Response } from 'express'
import { env } from 'cloudflare:workers'
import { jwtVerify, SignJWT } from 'jose'
import { getDb } from '../db'
import { adminUsers } from '../schema'
import { cacheFor, HttpError } from './http'

/**
 * Owner sessions (ARCHITECTURE.md §03): HS256 JWT in the HttpOnly cookie `gv_session`, 30 days,
 * revoked by bumping admin_users.updated_at (changing the password does). Stateless on purpose:
 * every request may hit a different isolate, so nothing is kept in memory (BLUEPRINT §5 #26).
 */

export const COOKIE = 'gv_session'
const MAX_AGE_S = 60 * 60 * 24 * 30
const BCRYPT_COST = 12
/** Compared against on an unknown email, so both failures cost the same time (§5 #15). */
const DUMMY_HASH = '$2b$12$z9Qhtm29orhCZSANatPAM.L1EJaHqDCe8C6TfRKr2XZ4mncT1.SZi'

export type Admin = { id: number; name: string; email: string }

/** Refuses to sign or verify with a missing or short secret (BLUEPRINT §5 #30). */
function key(): Uint8Array {
  const secret = env.JWT_SECRET
  if (!secret || secret.length < 32) throw new HttpError(503, 'Login is not set up on the server yet (JWT_SECRET is missing).')
  return new TextEncoder().encode(secret)
}

export const hashPassword = (password: string) => bcrypt.hash(password, BCRYPT_COST)

export async function checkPassword(password: string, hash: string | undefined): Promise<boolean> {
  const ok = await bcrypt.compare(password, hash ?? DUMMY_HASH)
  return ok && hash !== undefined
}

/** JWT iat has no milliseconds, so the watermark is floored to whole seconds too (§5 #14). */
export const wholeSecondsIso = (ms = Date.now()) => new Date(Math.floor(ms / 1000) * 1000).toISOString()

export async function issueSession(res: Response, req: Request, adminId: number) {
  const token = await new SignJWT({})
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(String(adminId))
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE_S}s`)
    .sign(key())
  res.append('Set-Cookie', cookie(req, token, MAX_AGE_S))
}

export function clearSession(res: Response, req: Request) {
  res.append('Set-Cookie', cookie(req, '', 0))
}

/**
 * Production: Secure; SameSite=None. Plain http://localhost: Lax without Secure, because Safari
 * drops Secure cookies on http (BLUEPRINT §5 #29).
 */
function cookie(req: Request, value: string, maxAge: number): string {
  const origin = req.get('origin') ?? ''
  const local = /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)
  const flags = local ? 'SameSite=Lax' : 'SameSite=None; Secure'
  return `${COOKIE}=${value}; HttpOnly; Path=/; Max-Age=${maxAge}; ${flags}`
}

function readCookie(req: Request): string | null {
  const header = req.get('cookie') ?? ''
  for (const part of header.split(';')) {
    const [name, ...rest] = part.trim().split('=')
    if (name === COOKIE) return rest.join('=') || null
  }
  return null
}

/** The signed-in owner, or null. Rejects tokens issued before the revocation watermark. */
export async function getVerifiedSession(req: Request): Promise<Admin | null> {
  const token = readCookie(req)
  if (!token) return null
  let sub: string | undefined
  let iat: number | undefined
  try {
    const { payload } = await jwtVerify(token, key(), { algorithms: ['HS256'] })
    sub = payload.sub
    iat = payload.iat
  } catch (err) {
    if (err instanceof HttpError) throw err
    return null
  }
  const id = Number(sub)
  if (!Number.isInteger(id) || iat === undefined) return null
  const [row] = await getDb()
    .select({ id: adminUsers.id, name: adminUsers.name, email: adminUsers.email, updatedAt: adminUsers.updatedAt })
    .from(adminUsers)
    .where(eq(adminUsers.id, id))
    .limit(1)
  if (!row) return null
  const watermark = Math.floor(new Date(row.updatedAt).getTime() / 1000)
  if (iat < watermark) return null
  return { id: row.id, name: row.name, email: row.email }
}

/**
 * Every admin route verifies the session itself; the SPA route guard is UX only (§5 #19).
 * Admin responses are never cached.
 */
export const requireAdmin: RequestHandler = async (req, res, next) => {
  cacheFor(res, 'none')
  try {
    const admin = await getVerifiedSession(req)
    if (!admin) {
      next(new HttpError(401, 'Please log in again.'))
      return
    }
    res.locals.admin = admin
    next()
  } catch (err) {
    next(err)
  }
}

export const currentAdmin = (res: Response): Admin => res.locals.admin as Admin
