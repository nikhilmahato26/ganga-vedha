import { env } from 'cloudflare:workers'
import { drizzle } from 'drizzle-orm/d1'
import * as schema from './schema'

/** The only place Drizzle is constructed. Swap this file to change database vendor (BLUEPRINT §3). */
export const getDb = () => drizzle(env.DB, { schema })

export type Db = ReturnType<typeof getDb>

/** ISO-8601 UTC, the format every *_at column holds. */
export const nowIso = () => new Date().toISOString()

export { schema }
