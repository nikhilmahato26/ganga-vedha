import "server-only";
import { v2 as cloudinary } from "cloudinary";
import { cloudinaryConfig } from "@/lib/env";

let configured = false;
function ensureConfigured() {
  if (configured) return;
  const { cloudName, apiKey, apiSecret } = cloudinaryConfig();
  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true,
  });
  configured = true;
}

/**
 * Signed uploads only. There is no public upload preset anywhere in this
 * project — a preset is a standing credential that never expires and cannot
 * be scoped to "this admin, this request, this folder", which is exactly
 * the surface an unsigned preset leaves open to being scraped and abused for
 * free storage. Every upload is signed here, server-side, after the caller
 * is already known to be an authenticated admin, and the signature is valid
 * for this one upload only.
 */
export function signUpload(params: {
  folder: string;
  publicId?: string;
}): {
  cloudName: string;
  apiKey: string;
  timestamp: number;
  signature: string;
  folder: string;
  publicId?: string;
} {
  ensureConfigured();
  const { cloudName, apiKey, apiSecret } = cloudinaryConfig();
  const timestamp = Math.round(Date.now() / 1000);

  const toSign: Record<string, string | number> = {
    timestamp,
    folder: params.folder,
    ...(params.publicId ? { public_id: params.publicId } : {}),
  };

  const signature = cloudinary.utils.api_sign_request(toSign, apiSecret);

  return {
    cloudName,
    apiKey,
    timestamp,
    signature,
    folder: params.folder,
    publicId: params.publicId,
  };
}

/** Used by the media-cleanup screen (Phase 6) and by hard-delete flows. */
export async function destroyAsset(publicId: string): Promise<void> {
  ensureConfigured();
  await cloudinary.uploader.destroy(publicId);
}
