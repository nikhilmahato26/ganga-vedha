import express from 'express'
import { httpServerHandler } from 'cloudflare:node'
import { cors, errorHandler, HttpError, jsonBody, originGuard } from './lib/http'
import { adminAuthRoutes } from './routes/admin-auth'
import { adminRpcRoutes } from './routes/admin-rpc'
import { publicRoutes } from './routes/public'

/**
 * Ganga Vedha API: Express 5 on a Cloudflare Worker (ARCHITECTURE.md §10).
 * Order matters: cors → originGuard (CSRF) → jsonBody → public routes → auth routes →
 * admin RPC (requireAdmin per call) → 404 → errors. Browsers reach this only through the site's own
 * /api proxy (ARCHITECTURE.md §02).
 */
const app = express()
app.disable('x-powered-by')

app.use(cors)
app.use(originGuard)
app.use(jsonBody)
app.use((_req, res, next) => {
  res.set('X-Content-Type-Options', 'nosniff')
  res.set('Referrer-Policy', 'no-referrer')
  next()
})

app.use(publicRoutes)
app.use(adminAuthRoutes)
app.use(adminRpcRoutes)

app.use((_req, _res, next) => next(new HttpError(404, 'There is nothing at this address.')))
app.use(errorHandler)

app.listen(3000)
export default httpServerHandler({ port: 3000 })
