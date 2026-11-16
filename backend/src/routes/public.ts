import { env } from 'cloudflare:workers'
import { Router, type Request, type RequestHandler, type Response } from 'express'
import { ADVENTURE_KINDS } from '../schema'
import { cacheFor, clientIp, HttpError } from '../lib/http'
import { hashKey, rateLimit } from '../lib/ratelimit'
import * as content from '../services/content'
import { submitEnquiry } from '../services/enquiry'

/**
 * Public, read-only content plus the enquiry endpoint. Every GET is cacheable for a minute
 * (closures for 30 s), so an admin edit shows on the live site within a minute without a rebuild.
 */
export const publicRoutes = Router()

type Kind = (typeof ADVENTURE_KINDS)[number]

/** Async handler with errors forwarded to the error middleware. */
const get = (path: string, policy: 'content' | 'closures', fn: (req: Request) => Promise<unknown>) => {
  const handler: RequestHandler = async (req, res, next) => {
    try {
      const data = await fn(req)
      if (data === null) throw new HttpError(404, 'Not found.')
      cacheFor(res, policy)
      res.json(data)
    } catch (err) {
      next(err)
    }
  }
  publicRoutes.get(path, handler)
}

get('/api/settings', 'content', () => content.getSiteSettings())
get('/api/promotions', 'content', () => content.getPromotions())
get('/api/adventures', 'content', req => {
  const kind = typeof req.query.kind === 'string' ? req.query.kind : undefined
  if (kind && !ADVENTURE_KINDS.includes(kind as Kind)) throw new HttpError(400, 'Unknown kind.')
  return content.getAdventures(kind as Kind | undefined)
})
get('/api/adventures/:slug', 'content', req => content.getAdventure(String(req.params.slug)))
get('/api/hotels', 'content', () => content.getHotels())
get('/api/hotels/:slug', 'content', req => content.getHotel(String(req.params.slug)))
get('/api/reviews', 'content', () => content.getReviews())
get('/api/gallery', 'content', () => content.getGalleryItems())
get('/api/closures', 'closures', () => content.getClosures())
get('/api/content-blocks/:key', 'content', req => content.getContentBlock(String(req.params.key)))
get('/api/hero-rooms', 'content', () => content.getHeroRooms())
get('/api/destinations', 'content', () => content.getDestinations())
get('/api/destinations/:slug', 'content', req => content.getDestination(String(req.params.slug)))
get('/api/packages', 'content', () => content.getPackages())
get('/api/packages/:slug', 'content', req => content.getPackage(String(req.params.slug)))
get('/api/rentals', 'content', () => content.getRentals())
get('/api/rentals/:slug', 'content', req => content.getRental(String(req.params.slug)))

/**
 * sitemap.xml for search engines, built from what is published right now. The site serves it at
 * /sitemap.xml through frontend/functions/sitemap.xml.ts; URLs use the address the crawler asked on.
 */
publicRoutes.get('/api/sitemap.xml', async (req, res, next) => {
  try {
    const base = (typeof req.query.base === 'string' && /^https?:\/\/[\w.-]+(:\d+)?$/.test(req.query.base) ? req.query.base : env.SITE_URL ?? '').replace(/\/$/, '')
    const [adventures, hotels, packages, destinations, rentals] = await Promise.all([
      content.getAdventures(),
      content.getHotels(),
      content.getPackages(),
      content.getDestinations(),
      content.getRentals(),
    ])
    const fixed: [string, string, number][] = [
      ['', 'daily', 1],
      ['/adventures', 'weekly', 0.9],
      ['/rafting', 'daily', 0.9],
      ['/packages', 'weekly', 0.9],
      ['/stays', 'weekly', 0.8],
      ['/hotels', 'weekly', 0.8],
      ['/rentals', 'weekly', 0.7],
      ['/gallery', 'weekly', 0.5],
      ['/about', 'monthly', 0.5],
      ['/contact', 'monthly', 0.6],
      ['/privacy-policy', 'yearly', 0.3],
      ['/refund-policy', 'yearly', 0.3],
    ]
    const prefix = (kind: string) => (kind === 'rafting' || kind === 'bungee' ? `/${kind}` : '/adventures')
    const urls: [string, string, number][] = [
      ...fixed,
      ...adventures.map(a => [`${prefix(a.kind)}/${a.slug}`, 'weekly', 0.7] as [string, string, number]),
      ...packages.map(p => [`/packages/${p.slug}`, 'weekly', 0.7] as [string, string, number]),
      ...destinations.map(d => [`/stays/${d.slug}`, 'weekly', 0.7] as [string, string, number]),
      ...hotels.map(h => [`/hotels/${h.slug}`, 'weekly', 0.6] as [string, string, number]),
      ...rentals.map(r => [`/rentals/${r.slug}`, 'weekly', 0.6] as [string, string, number]),
    ]
    const xml =
      '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
      urls.map(([path, freq, pri]) => `  <url><loc>${base}${path}</loc><changefreq>${freq}</changefreq><priority>${pri}</priority></url>`).join('\n') +
      '\n</urlset>\n'
    res.set('Cache-Control', 'public, max-age=3600')
    res.type('application/xml').send(xml)
  } catch (err) {
    next(err)
  }
})

publicRoutes.get('/api/health', (_req, res: Response) => {
  cacheFor(res, 'none')
  res.json({ ok: true })
})

/**
 * Enquiries: validated again here with the same Zod schema as the form, phone normalised,
 * product name and price snapshotted server-side, honeypot silently accepted (services/enquiry.ts).
 * Per-IP limit on top of the per-phone limit inside the service.
 */
publicRoutes.post('/api/enquiries', async (req, res, next) => {
  try {
    cacheFor(res, 'none')
    const ipHash = await hashKey(clientIp(req))
    await rateLimit(`enquiry:${ipHash}`, 20, 3600, 'Too many enquiries from this connection. Message us on WhatsApp and we’ll pick it up there.')
    const result = await submitEnquiry(req.body, { ipHash, userAgent: req.get('user-agent')?.slice(0, 300) ?? null })
    res.status(result.ok ? 201 : 400).json(result)
  } catch (err) {
    next(err)
  }
})
