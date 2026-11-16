/**
 * Client-side image downscaling, run before a file ever leaves the browser.
 *
 * The owner will be uploading straight off a phone camera — 8-12 MB JPEGs at
 * 4000px+ on one side. Uploading that raw wastes the client's Cloudinary
 * storage quota and takes forever on a riverside 4G connection. Capping the
 * long edge at 2000px and re-encoding to a reasonable JPEG quality gets a
 * typical phone photo from ~8MB down to a few hundred KB before upload even
 * starts, with no visible loss at the sizes this site ever displays a photo.
 */

/** Pure and DOM-free so it can be unit tested without a canvas or a browser. */
export function computeResizeDimensions(
  width: number,
  height: number,
  maxDimension: number,
): { width: number; height: number; scaled: boolean } {
  if (width <= 0 || height <= 0) {
    throw new Error(`Invalid source dimensions: ${width}x${height}`);
  }
  const longest = Math.max(width, height);
  if (longest <= maxDimension) {
    return { width, height, scaled: false };
  }
  const scale = maxDimension / longest;
  return {
    width: Math.round(width * scale),
    height: Math.round(height * scale),
    scaled: true,
  };
}

export type ResizeResult = {
  blob: Blob;
  width: number;
  height: number;
  /** False when the source was already within bounds and passed through unchanged. */
  wasResized: boolean;
};

export async function resizeImageFile(
  file: File,
  maxDimension = 2000,
  quality = 0.86,
): Promise<ResizeResult> {
  if (!file.type.startsWith("image/")) {
    throw new Error(`Not an image: ${file.type || "unknown type"}`);
  }
  // SVGs have no fixed raster dimensions to scale against — pass through.
  if (file.type === "image/svg+xml") {
    return { blob: file, width: 0, height: 0, wasResized: false };
  }

  const bitmap = await createImageBitmap(file);
  try {
    const { width, height, scaled } = computeResizeDimensions(
      bitmap.width,
      bitmap.height,
      maxDimension,
    );

    // Already small enough and not a format we'd want to re-encode away from
    // (re-encoding a PNG as JPEG would silently drop transparency).
    if (!scaled && file.type !== "image/png") {
      return { blob: file, width: bitmap.width, height: bitmap.height, wasResized: false };
    }

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas 2D context unavailable.");
    ctx.drawImage(bitmap, 0, 0, width, height);

    const outputType = file.type === "image/png" && !scaled ? "image/png" : "image/jpeg";
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, outputType, quality),
    );
    if (!blob) throw new Error("Canvas failed to encode the resized image.");

    return { blob, width, height, wasResized: true };
  } finally {
    bitmap.close();
  }
}
