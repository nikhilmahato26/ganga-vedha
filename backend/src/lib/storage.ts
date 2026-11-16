import { env } from 'cloudflare:workers'
import { HttpError } from './http'

/**
 * Cloudinary adapter (BLUEPRINT §3: swap this file to change storage vendor).
 *
 * Signed uploads only. There is no public upload preset anywhere in this project: a preset is a
 * standing credential that never expires. The Worker signs one upload ticket per request, only
 * after the admin session is verified, and the browser posts the (already resized) file straight
 * to Cloudinary with it, so a 20-photo batch never passes through the Worker's body limit.
 */

type Config = { cloud: string; key: string; secret: string }

function config(): Config {
  const cloud = env.CLOUDINARY_CLOUD_NAME?.trim()
  const key = env.CLOUDINARY_API_KEY?.trim()
  const secret = env.CLOUDINARY_API_SECRET?.trim()
  if (!cloud || !key || !secret) throw new HttpError(503, 'Photo storage isn’t connected yet. Add the Cloudinary keys to the API Worker (ARCHITECTURE.md §05).')
  return { cloud, key, secret }
}

export const storageConfigured = () => Boolean(env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY && env.CLOUDINARY_API_SECRET)

/** Cloudinary's request signature: SHA-1 of the sorted params joined with &, then the secret. */
async function sign(params: Record<string, string | number>, secret: string): Promise<string> {
  const base = Object.keys(params)
    .sort()
    .map(k => `${k}=${params[k]}`)
    .join('&')
  const digest = await crypto.subtle.digest('SHA-1', new TextEncoder().encode(base + secret))
  return Array.from(new Uint8Array(digest), b => b.toString(16).padStart(2, '0')).join('')
}

export type UploadTicket = {
  cloudName: string
  apiKey: string
  timestamp: number
  signature: string
  folder: string
  publicId?: string
}

/** A one-shot signed upload ticket for one folder. */
export async function signUpload(params: { folder: string; publicId?: string }): Promise<UploadTicket> {
  const c = config()
  const timestamp = Math.round(Date.now() / 1000)
  const toSign: Record<string, string | number> = { timestamp, folder: params.folder, ...(params.publicId ? { public_id: params.publicId } : {}) }
  return { cloudName: c.cloud, apiKey: c.key, timestamp, signature: await sign(toSign, c.secret), folder: params.folder, publicId: params.publicId }
}

/** Deletes one asset. An already-missing asset is not an error ("not found" is reported as ok). */
export async function destroyAsset(publicId: string): Promise<void> {
  const c = config()
  const timestamp = Math.round(Date.now() / 1000)
  const form = new FormData()
  form.set('public_id', publicId)
  form.set('timestamp', String(timestamp))
  form.set('api_key', c.key)
  form.set('signature', await sign({ public_id: publicId, timestamp }, c.secret))
  const res = await fetch(`https://api.cloudinary.com/v1_1/${c.cloud}/image/destroy`, { method: 'POST', body: form })
  if (!res.ok) {
    console.error('Cloudinary destroy failed with status', res.status)
    throw new HttpError(502, 'The photo could not be deleted from storage. Please try again in a minute.')
  }
}
