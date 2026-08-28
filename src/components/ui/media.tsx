import * as React from "react";
import Image from "next/image";
import { ImageOff } from "lucide-react";
import { cn } from "@/lib/utils";

export type MediaSource = {
  /** Cloudinary secure_url, or any absolute URL. */
  src: string;
  alt: string;
  width?: number | null;
  height?: number | null;
  /** Tiny base64 LQIP from the media table, so a card never pops in blank. */
  placeholder?: string | null;
};

/** Stable hash so the same product always gets the same stand-in. */
function standInGradient(seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
  const pick = Math.abs(h) % STAND_INS.length;
  return STAND_INS[pick];
}

/* Drawn from the jade and granite ramps only — river tones, no invented scene. */
const STAND_INS = [
  "linear-gradient(150deg,#13504a 0%,#12655b 46%,#1e9e8a 100%)",
  "linear-gradient(150deg,#13433e 0%,#137f70 52%,#3fbba4 100%)",
  "linear-gradient(150deg,#052926 0%,#12655b 58%,#74d5c0 100%)",
  "linear-gradient(150deg,#2e3734 0%,#13504a 50%,#1e9e8a 100%)",
  "linear-gradient(150deg,#12655b 0%,#3fbba4 60%,#a9e8d8 100%)",
];

const RATIOS = {
  card: "aspect-[4/3]",
  wide: "aspect-[16/9]",
  hero: "aspect-[4/5] sm:aspect-[16/10] lg:aspect-[21/9]",
  square: "aspect-square",
  portrait: "aspect-[3/4]",
} as const;

/**
 * The single place a photograph enters the design system.
 *
 * Owns the aspect ratio, the scrim that keeps chips legible over any frame,
 * the blur-up placeholder, and the honest empty state for a product the client
 * has not photographed yet. Nothing else should render a bare <img>: the
 * scrim and the ratio are what make the card anatomy survive real photos
 * instead of the flat placeholder blocks Phase 0 was built against.
 */
export function MediaFrame({
  media,
  ratio = "card",
  sizes = "(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw",
  priority = false,
  scrim = true,
  className,
  children,
  emptyLabel = "Photo coming soon",
  standInSeed,
  mark = true,
}: {
  media?: MediaSource | null;
  ratio?: keyof typeof RATIOS;
  sizes?: string;
  priority?: boolean;
  /** Turn off only where nothing is overlaid on the image. */
  scrim?: boolean;
  className?: string;
  /** Chips and captions that sit on the media. */
  children?: React.ReactNode;
  emptyLabel?: string;
  /** Seeds the stand-in so a product keeps the same panel across renders. */
  standInSeed?: string;
  /**
   * Draw the placeholder mark. Turn it off where the frame is acting as a
   * background behind copy — a glyph centred under a headline reads as a
   * broken image, not as a pending one.
   */
  mark?: boolean;
}) {
  return (
    <div
      className={cn(
        "relative isolate overflow-hidden bg-jade-900",
        RATIOS[ratio],
        // The scrim is not conditional on a photograph existing: it is what the
        // chip rows are positioned against, so it must be verifiable before the
        // client supplies imagery.
        scrim && "scrim-media",
        className,
      )}
    >
      {media ? (
        <Image
          src={media.src}
          alt={media.alt}
          fill
          sizes={sizes}
          priority={priority}
          placeholder={media.placeholder ? "blur" : "empty"}
          blurDataURL={media.placeholder ?? undefined}
          className="object-cover"
        />
      ) : (
        /* A deterministic tonal stand-in, seeded from the caption so a page has
           its shape and rhythm before the client supplies photography. It is
           palette geometry, never a pretend photograph, and it carries the
           ImageOff mark so nobody mistakes it for one. */
        <div
          className="absolute inset-0 grid place-items-center"
          style={{ background: standInGradient(standInSeed ?? emptyLabel) }}
        >
          {mark && <ImageOff className="size-7 text-white/40" aria-hidden />}
          <span className="sr-only">{emptyLabel}</span>
        </div>
      )}
      {/* The scrim is an ::after on this element and therefore paints after
          every normal child, so overlaid content is lifted onto the shared
          z-scale rather than an arbitrary number. The wrapper spans the frame
          so chips can still position against its edges. */}
      {children && (
        <div className="absolute inset-0 z-(--z-raised)">{children}</div>
      )}
    </div>
  );
}
