/** Bindings and vars the Worker reads through `import { env } from 'cloudflare:workers'`. */
declare global {
  namespace Cloudflare {
    interface Env {
      DB: D1Database
      /** Worker Secret. ≥ 32 chars, or login answers 503 (BLUEPRINT §5 #30). */
      JWT_SECRET?: string
      /** Comma-separated site addresses allowed by CORS and originGuard. */
      SITE_ORIGIN?: string
      /** The public site address, for links in alert emails. */
      SITE_URL?: string
      /** Cloudinary account name (public). Uploads answer 503 until all three Cloudinary values are set. */
      CLOUDINARY_CLOUD_NAME?: string
      /** Worker Secret. */
      CLOUDINARY_API_KEY?: string
      /** Worker Secret. Signs uploads; never leaves the Worker. */
      CLOUDINARY_API_SECRET?: string
      SMTP_HOST?: string
      SMTP_PORT?: string
      /** Worker Secret. The Gmail address that sends new-enquiry alerts. Optional. */
      SMTP_USER?: string
      /** Worker Secret. A Google app password (16 chars), never the account password. */
      SMTP_PASS?: string
      /** Where alerts go. Defaults to SMTP_USER. */
      ENQUIRY_NOTIFY_TO?: string
    }
  }
}

declare module 'cloudflare:node' {
  /** Bridges a Node http server listening on `port` to the Worker fetch handler. */
  export function httpServerHandler(options: { port: number }): ExportedHandler
}

export {}
