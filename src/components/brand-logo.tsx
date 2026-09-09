import * as React from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

/**
 * The one place the brand mark lives. Every header, footer, sidebar and
 * sign-in screen renders it through here, so the file, the radius and the
 * alt text are stated once and can never drift apart between surfaces.
 *
 * The source is a 4320px square lockup on a navy ground — no alpha — so it
 * is always corner-rounded (`rounded-md`, 10px) to sit inside the card
 * language rather than reading as a stray photograph. next/image resizes it
 * down per surface; the browser never sees the full-size file.
 */

const SIZES = {
  sm: 44,
  md: 56,
  lg: 76,
  xl: 104,
} as const;

export type BrandLogoSize = keyof typeof SIZES;

export function BrandLogo({
  size = "md",
  className,
  priority = false,
  alt = "",
}: {
  size?: BrandLogoSize;
  className?: string;
  priority?: boolean;
  /**
   * Empty by default: the mark almost always sits beside the brand name in
   * text, and a second reading of "Ganga Vedha" is noise to a screen reader.
   * Pass a name when the logo stands alone.
   */
  alt?: string;
}) {
  const px = SIZES[size];
  return (
    <Image
      src="/Ganga-veda.png"
      alt={alt}
      width={px}
      height={px}
      sizes={`${px}px`}
      priority={priority}
      aria-hidden={alt === "" ? true : undefined}
      className={cn("shrink-0 rounded-md object-contain", className)}
      style={{ width: px, height: px }}
    />
  );
}
