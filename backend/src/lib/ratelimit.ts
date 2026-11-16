import { env } from 'cloudflare:workers'
import { HttpError } from './http'

/**
 * Fixed-window counter in D1. One atomic upsert per hit, so two isolates can't both slip under the
 * limit. Old rows are pruned now and then; the table stays tiny.
 */
export async function rateLimit(key: string, limit: number, windowSeconds: number, message: string) {
  const nowS = Math.floor(Date.now() / 1000)
  const windowStart = nowS - (nowS % windowSeconds)
  const row = await env.DB.prepare(
    `INSERT INTO rate_limits (key, window_start, count) VALUES (?1, ?2, 1)
     ON CONFLICT (key) DO UPDATE SET
       count = CASE WHEN rate_limits.window_start = excluded.window_start THEN rate_limits.count + 1 ELSE 1 END,
       window_start = excluded.window_start
     RETURNING count`,
  )
    .bind(key, windowStart)
    .first<{ count: number }>()
  if (Math.random() < 0.02) await env.DB.prepare('DELETE FROM rate_limits WHERE window_start < ?1').bind(nowS - 86_400).run()
  if ((row?.count ?? 0) > limit) throw new HttpError(429, message)
}

/** One-way, keyed hash of an IP or email: enough to count, useless to anyone reading the table. */
export async function hashKey(value: string): Promise<string> {
  const secret = new TextEncoder().encode(`gv-rl:${env.JWT_SECRET ?? 'unset'}`)
  const k = await crypto.subtle.importKey('raw', secret, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  const sig = new Uint8Array(await crypto.subtle.sign('HMAC', k, new TextEncoder().encode(value.toLowerCase())))
  return Array.from(sig.slice(0, 16), b => b.toString(16).padStart(2, '0')).join('')
}
