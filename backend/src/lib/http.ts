import type { ErrorRequestHandler, NextFunction, Request, RequestHandler, Response } from 'express'
import { env } from 'cloudflare:workers'

/**
 * Request plumbing shared by every route: CORS, the CSRF origin guard, body parsing, the cache
 * policy and error shaping. ARCHITECTURE.md §04 is the contract for the first two.
 */

export class HttpError extends Error {
  status: number
  fields?: Record<string, string>
  constructor(status: number, message: string, fields?: Record<string, string>) {
    super(message)
    this.status = status
    this.fields = fields
  }
}

export const notFound = (what = 'That item') => new HttpError(404, `${what} no longer exists. It may have been deleted.`)

/** The exact site addresses allowed, from SITE_ORIGIN. Never `*`. */
export function allowedOrigins(): Set<string> {
  return new Set(
    (env.SITE_ORIGIN ?? '')
      .split(',')
      .map(s => s.trim().replace(/\/$/, ''))
      .filter(Boolean),
  )
}

const UNSAFE = new Set(['POST', 'PUT', 'PATCH', 'DELETE'])

export const cors: RequestHandler = (req, res, next) => {
  const origin = req.get('origin')
  res.vary('Origin')
  if (origin && allowedOrigins().has(origin)) {
    res.set('Access-Control-Allow-Origin', origin)
    res.set('Access-Control-Allow-Credentials', 'true')
  }
  if (req.method === 'OPTIONS') {
    res.set('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS')
    res.set('Access-Control-Allow-Headers', 'content-type')
    res.set('Access-Control-Max-Age', '600')
    res.status(204).end()
    return
  }
  next()
}

/**
 * CSRF guard: the cookie is SameSite=None, so any write whose Origin is present and not ours is
 * refused. Browsers always send Origin on cross-site writes and a page cannot forge it.
 */
export const originGuard: RequestHandler = (req, _res, next) => {
  const origin = req.get('origin')
  if (UNSAFE.has(req.method) && origin && !allowedOrigins().has(origin)) {
    next(new HttpError(403, 'This site address is not allowed to make changes. Add it to SITE_ORIGIN.'))
    return
  }
  next()
}

/**
 * Buffer the request body with a hard cap. Content-Length is checked before reading; if the size
 * only shows while reading, the rest is drained so the connection stays usable (BLUEPRINT §5 #36).
 */
export async function readBody(req: Request, limit: number): Promise<Uint8Array> {
  const declared = Number(req.get('content-length') ?? 0)
  if (declared > limit) {
    req.resume()
    throw new HttpError(413, tooLarge(limit))
  }
  const chunks: Uint8Array[] = []
  let size = 0
  let over = false
  for await (const chunk of req as AsyncIterable<Uint8Array>) {
    if (over) continue
    size += chunk.byteLength
    if (size > limit) over = true
    else chunks.push(chunk)
  }
  if (over) throw new HttpError(413, tooLarge(limit))
  const out = new Uint8Array(size)
  let offset = 0
  for (const c of chunks) {
    out.set(c, offset)
    offset += c.byteLength
  }
  return out
}

const tooLarge = (limit: number) => `That is too large. The limit is ${Math.round(limit / 1024 / 1024) || 1} MB.`

const JSON_LIMIT = 256 * 1024

/** Hand-written JSON parser: express.json() crashes workerd at startup (BLUEPRINT §5 #23). */
export const jsonBody: RequestHandler = async (req, _res, next) => {
  if (!UNSAFE.has(req.method) || !req.is('application/json')) return next()
  try {
    const raw = new TextDecoder().decode(await readBody(req, JSON_LIMIT))
    req.body = raw ? JSON.parse(raw) : {}
    next()
  } catch (err) {
    next(err instanceof HttpError ? err : new HttpError(400, 'The request body is not valid JSON.'))
  }
}

/** The slice of a Zod schema `parse` needs. Typed structurally: zod is installed in frontend/. */
type Schema<T> = {
  safeParse(input: unknown): { success: true; data: T } | { success: false; error: { issues: { path: PropertyKey[]; message: string }[] } }
}

/** Parse with a shared Zod schema; field errors keyed by the first path segment (BLUEPRINT §7.2). */
export function parse<T>(schema: Schema<T>, input: unknown): T {
  const r = schema.safeParse(input)
  if (r.success) return r.data
  const fields: Record<string, string> = {}
  for (const issue of r.error.issues) {
    const key = String(issue.path[0] ?? '_')
    fields[key] ??= issue.message
  }
  throw new HttpError(400, 'Some details need fixing.', fields)
}

export function idParam(req: Request, name = 'id'): number {
  const id = Number(req.params[name])
  if (!Number.isInteger(id) || id <= 0) throw new HttpError(400, 'That id is not valid.')
  return id
}

/**
 * Freshness, decided once (BLUEPRINT §5 #8): closures ≤ 30 s, low-churn content ≤ 300 s. Photos are
 * served by Cloudinary's CDN, not here. Admin endpoints and mutations are never cached.
 */
const POLICY = {
  closures: 'public, max-age=30',
  content: 'public, max-age=60, stale-while-revalidate=240',
  none: 'no-store',
} as const

export function cacheFor(res: Response, kind: keyof typeof POLICY) {
  res.set('Cache-Control', POLICY[kind])
}

export const noStore: RequestHandler = (_req, res, next) => {
  cacheFor(res, 'none')
  next()
}

/** Walk Drizzle's error.cause chain for SQLite's UNIQUE failure (BLUEPRINT §5 #37). */
export function uniqueViolation(err: unknown): string | null {
  for (let e: unknown = err, depth = 0; e && depth < 6; e = (e as { cause?: unknown }).cause, depth++) {
    const msg = String((e as { message?: unknown }).message ?? '')
    const m = msg.match(/UNIQUE constraint failed: \w+\.(\w+)/)
    if (m) return m[1]
  }
  return null
}

const FIELD_FOR_COLUMN: Record<string, string> = { slug: 'slug', email: 'email', ref_code: '_' }

export const errorHandler: ErrorRequestHandler = (err, _req, res, next: NextFunction) => {
  if (res.headersSent) return next(err)
  cacheFor(res, 'none')
  if (err instanceof HttpError) {
    res.status(err.status).json({ ok: false, error: err.message, fields: err.fields })
    return
  }
  const column = uniqueViolation(err)
  if (column) {
    const field = FIELD_FOR_COLUMN[column] ?? column
    res.status(409).json({ ok: false, error: 'That is already used. Choose another.', fields: { [field]: 'Already used. Choose another.' } })
    return
  }
  // Message only: request bodies may hold customer names and numbers (AGENTS.md §05).
  console.error('Unhandled error:', err instanceof Error ? err.message : String(err))
  res.status(500).json({ ok: false, error: 'Something went wrong on our side. Please try again.' })
}

/**
 * The visitor's IP, used only hashed (rate limits, enquiry ip_hash). Through the /api proxy the
 * Worker would see the Pages Function, so every visitor would share one rate-limit bucket; the
 * proxy passes the real address in x-gv-client-ip. It is trusted only on requests Cloudflare marks
 * as coming from a Worker (cf-worker), which a browser cannot set.
 */
export function clientIp(req: Request): string {
  const forwarded = req.get('cf-worker') ? req.get('x-gv-client-ip') : undefined
  return forwarded || req.get('cf-connecting-ip') || 'unknown'
}
