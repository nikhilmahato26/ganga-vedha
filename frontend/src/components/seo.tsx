import { useMatches } from "react-router-dom";
import { SEO_KEYWORDS } from "@/lib/seo-keywords";

/** The subset of Next.js page metadata this site uses. Each route's loader returns one. */
export type Metadata = {
  title?: string | { absolute: string };
  description?: string;
  alternates?: { canonical?: string };
  openGraph?: { title?: string; description?: string; images?: string[] };
  robots?: { index?: boolean; follow?: boolean };
};

const SITE_NAME = "Ganga Veda";
const DEFAULT_TITLE = "Ganga Veda Hotels & Resorts — Hotels in Tapovan, Rishikesh";
const DEFAULT_DESCRIPTION =
  "Ganga Veda Hotels & Resorts, Tapovan, Rishikesh: affordable rooms near Laxman Jhula and Ram Jhula, plus river rafting, bungee jumping, adventure packages and Uttarakhand tours. Book direct on WhatsApp.";
/** The public address, for canonical and Open Graph URLs (set per build; defaults to this origin). */
const SITE_URL = (import.meta.env.VITE_SITE_URL || (typeof window !== "undefined" ? window.location.origin : "")).replace(
  /\/$/,
  "",
);

/**
 * Head tags for the current page, from the deepest route whose loader returned `metadata`. React 19
 * hoists <title>, <meta> and <link> into <head> wherever they render, and swaps them on navigation.
 */
export function RouteMeta() {
  const matches = useMatches();
  let meta: Metadata | undefined;
  for (const m of matches) {
    const data = m.data as { metadata?: Metadata } | undefined;
    if (data?.metadata) meta = data.metadata;
  }
  const m = meta ?? {};
  const title =
    typeof m.title === "object" ? m.title.absolute : m.title ? `${m.title} · ${SITE_NAME}` : DEFAULT_TITLE;
  const description = m.description ?? DEFAULT_DESCRIPTION;
  const canonical = m.alternates?.canonical ? `${SITE_URL}${m.alternates.canonical}` : undefined;
  const noindex = m.robots && m.robots.index === false;

  return (
    <>
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={SEO_KEYWORDS.join(", ")} />
      {canonical && <link rel="canonical" href={canonical} />}
      {noindex && <meta name="robots" content="noindex, nofollow" />}
      <meta property="og:type" content="website" />
      <meta property="og:locale" content="en_IN" />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:title" content={m.openGraph?.title ?? title} />
      <meta property="og:description" content={m.openGraph?.description ?? description} />
      <meta property="og:image" content={m.openGraph?.images?.[0] ?? `${SITE_URL}/og-image.png`} />
      {canonical && <meta property="og:url" content={canonical} />}
      <meta name="twitter:card" content="summary_large_image" />
    </>
  );
}
