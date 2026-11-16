import { Router } from 'express'
import * as adventures from '../actions/adventures'
import * as bookings from '../actions/bookings'
import * as closures from '../actions/closures'
import * as contentBlocks from '../actions/content-blocks'
import * as destinations from '../actions/destinations'
import * as gallery from '../actions/gallery'
import * as hotels from '../actions/hotels'
import * as media from '../actions/media'
import * as packages from '../actions/packages'
import * as promotions from '../actions/promotions'
import * as rentals from '../actions/rentals'
import * as reviews from '../actions/reviews'
import * as settings from '../actions/settings'
import { currentAdmin, requireAdmin, type Admin } from '../lib/auth'
import { HttpError } from '../lib/http'
import * as data from '../services/admin-data'

/**
 * The admin API: one POST per admin function, `/api/admin/rpc/<module>.<function>` with
 * `{ "args": [...] }`. These are the original Next.js server actions and admin reads, unchanged in
 * behaviour, called with the verified owner first. Only the functions listed in REGISTRY are
 * reachable; `requireAdmin` runs before every one of them, and `originGuard` (index.ts) rejects
 * cross-site writes. frontend/src/lib/actions/ and admin-data.ts are the typed callers.
 */

// The one place an `any` is allowed: the registry maps names to functions of differing shapes.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Fn = (admin: Admin, ...args: any[]) => Promise<unknown>

/** Admin reads don't need the session (it's already verified); adapt them to the same shape. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const read = <A extends any[]>(fn: (...args: A) => Promise<unknown>): Fn => (_admin, ...args) => fn(...(args as A))

const actions = { adventures, bookings, closures, contentBlocks, destinations, gallery, hotels, media, packages, promotions, rentals, reviews, settings }

const REGISTRY = new Map<string, Fn>()
for (const [module, exports] of Object.entries(actions)) {
  for (const [name, fn] of Object.entries(exports)) {
    if (typeof fn === 'function') REGISTRY.set(`${module}.${name}`, fn as Fn)
  }
}
for (const [name, fn] of Object.entries(data)) {
  if (typeof fn === 'function') REGISTRY.set(`data.${name}`, read(fn as (...args: unknown[]) => Promise<unknown>))
}

export const adminRpcRoutes = Router()

adminRpcRoutes.post('/api/admin/rpc/:name', requireAdmin, async (req, res, next) => {
  try {
    const fn = REGISTRY.get(String(req.params.name))
    if (!fn) throw new HttpError(404, 'There is no such admin action.')
    const args: unknown = req.body?.args ?? []
    if (!Array.isArray(args)) throw new HttpError(400, 'args must be an array.')
    const result = await fn(currentAdmin(res), ...args)
    res.json({ result: result ?? null })
  } catch (err) {
    next(err)
  }
})

/** For the frontend's typed callers and for tests: every reachable name. */
export const rpcNames = () => [...REGISTRY.keys()].sort()
