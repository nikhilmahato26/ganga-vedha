import { eq, sql } from 'drizzle-orm'
import { Router } from 'express'
import { getDb } from '../db'
import { checkPassword, clearSession, currentAdmin, getVerifiedSession, hashPassword, issueSession, requireAdmin, wholeSecondsIso } from '../lib/auth'
import { cacheFor, clientIp, HttpError, noStore } from '../lib/http'
import { hashKey, rateLimit } from '../lib/ratelimit'
import { adminUsers } from '../schema'

/**
 * Login, logout, "who am I" and change password (ARCHITECTURE.md §03). The owner account already
 * exists (created by the seed, carried over from Neon); there is no public sign-up or setup screen.
 */
export const adminAuthRoutes = Router()
adminAuthRoutes.use('/api/admin', noStore)

const GENERIC_ERROR = 'Email or password is incorrect.'

adminAuthRoutes.post('/api/admin/login', async (req, res, next) => {
  try {
    const email = typeof req.body?.email === 'string' ? req.body.email.trim() : ''
    const password = typeof req.body?.password === 'string' ? req.body.password : ''
    if (!email || !password) throw new HttpError(400, 'Enter your email and password.')
    await rateLimit(`login:${await hashKey(clientIp(req))}`, 10, 900, 'Too many login attempts. Wait 15 minutes and try again.')
    const db = getDb()
    const [user] = await db
      .select()
      .from(adminUsers)
      .where(sql`lower(${adminUsers.email}) = lower(${email})`)
      .limit(1)
    // Same work and the same error for "no such account" and "wrong password" (§5 #15).
    if (!(await checkPassword(password, user?.passwordHash))) throw new HttpError(401, GENERIC_ERROR)
    await issueSession(res, req, user.id)
    await db.update(adminUsers).set({ lastLoginAt: new Date().toISOString() }).where(eq(adminUsers.id, user.id))
    res.json({ ok: true, admin: { id: user.id, name: user.name, email: user.email } })
  } catch (err) {
    next(err)
  }
})

adminAuthRoutes.post('/api/admin/logout', (req, res) => {
  clearSession(res, req)
  res.json({ ok: true })
})

/** The login page calls this right after a correct password to prove the cookie stuck (§03). */
adminAuthRoutes.get('/api/admin/me', async (req, res, next) => {
  try {
    cacheFor(res, 'none')
    const admin = await getVerifiedSession(req)
    if (!admin) throw new HttpError(401, 'Not logged in.')
    res.json({ ok: true, admin })
  } catch (err) {
    next(err)
  }
})

/**
 * Changing the password bumps updated_at, which logs out every other session; this device gets a
 * fresh cookie issued after the new watermark so it stays signed in.
 */
adminAuthRoutes.post('/api/admin/password', requireAdmin, async (req, res, next) => {
  try {
    const admin = currentAdmin(res)
    const current = typeof req.body?.currentPassword === 'string' ? req.body.currentPassword : ''
    const next_ = typeof req.body?.newPassword === 'string' ? req.body.newPassword : ''
    const confirm = typeof req.body?.confirmPassword === 'string' ? req.body.confirmPassword : ''
    if (!current) throw new HttpError(400, 'Enter your current password.')
    if (next_.length < 12) throw new HttpError(400, 'New password must be at least 12 characters.')
    if (next_ !== confirm) throw new HttpError(400, "New passwords don't match.")
    const db = getDb()
    const [user] = await db.select().from(adminUsers).where(eq(adminUsers.id, admin.id)).limit(1)
    if (!user) throw new HttpError(404, 'Account not found.')
    if (!(await checkPassword(current, user.passwordHash))) throw new HttpError(400, 'Current password is incorrect.')
    // Whole seconds, like JWT iat: older sessions fall below it, the token issued next does not.
    const watermark = wholeSecondsIso()
    await db
      .update(adminUsers)
      .set({ passwordHash: await hashPassword(next_), updatedAt: watermark })
      .where(eq(adminUsers.id, admin.id))
    await issueSession(res, req, admin.id)
    res.json({ ok: true })
  } catch (err) {
    next(err)
  }
})
