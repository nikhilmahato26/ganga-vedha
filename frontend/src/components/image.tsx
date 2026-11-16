import type { CSSProperties, ImgHTMLAttributes } from "react";

type Props = Omit<ImgHTMLAttributes<HTMLImageElement>, "src" | "placeholder" | "width" | "height"> & {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  /** Fill the nearest positioned parent (the parent sets the size), like next/image `fill`. */
  fill?: boolean;
  /** Load eagerly with high priority: the hero and the first cards above the fold. */
  priority?: boolean;
  placeholder?: "blur" | "empty";
  /** Tiny base64 image shown underneath until the photo arrives. */
  blurDataURL?: string;
};

const WIDTHS = [320, 480, 640, 768, 960, 1280, 1600, 1920];
const CLOUDINARY = /^(https:\/\/res\.cloudinary\.com\/[^/]+\/image\/upload\/)(.+)$/;

/**
 * A plain <img> standing in for next/image. Cloudinary photos get a responsive srcset built from
 * Cloudinary's own transforms (resize + WebP/AVIF per browser), which is what next/image's
 * optimiser used to do for us; local files in public/ are served as they are.
 */
export default function Image({
  src,
  alt,
  width,
  height,
  fill,
  priority,
  placeholder,
  blurDataURL,
  sizes,
  style,
  ...rest
}: Props) {
  const m = CLOUDINARY.exec(src);
  const transformed = m
    ? {
        src: `${m[1]}f_auto,q_auto,c_limit,w_1280/${m[2]}`,
        srcSet: WIDTHS.map((w) => `${m[1]}f_auto,q_auto,c_limit,w_${w}/${m[2]} ${w}w`).join(", "),
      }
    : { src, srcSet: undefined };

  const css: CSSProperties = {
    ...(fill ? { position: "absolute", inset: 0, width: "100%", height: "100%" } : {}),
    ...(placeholder === "blur" && blurDataURL
      ? { backgroundImage: `url("${blurDataURL}")`, backgroundSize: "cover", backgroundPosition: "center" }
      : {}),
    ...style,
  };

  return (
    <img
      {...rest}
      src={transformed.src}
      srcSet={transformed.srcSet}
      sizes={transformed.srcSet ? (sizes ?? (fill ? "100vw" : width ? `${width}px` : "100vw")) : undefined}
      alt={alt}
      width={fill ? undefined : width}
      height={fill ? undefined : height}
      loading={priority ? "eager" : "lazy"}
      fetchPriority={priority ? "high" : undefined}
      decoding="async"
      style={css}
    />
  );
}
