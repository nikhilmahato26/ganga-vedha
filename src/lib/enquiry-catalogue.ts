import "server-only";
import {
  getAdventures,
  getClosures,
  getDestinations,
  getHotels,
  getPackages,
  getRentals,
} from "@/lib/content";
import { resolveClosure } from "@/lib/closure";
import { formatINR, formatKm } from "@/lib/format";
import type { EnquiryOption, EnquiryOptionGroup } from "@/lib/enquiry-schema";

/**
 * Everything a guest can enquire about, in one list, built from the same
 * published content the site itself renders.
 *
 * The contact form used to take a free-text line here, which meant the owner's
 * inbox filled with "raftin 16km", "the bungee one" and names of trips that
 * were never listed. A picker fed from this function means a chosen listing
 * arrives with its real kind and slug, so `submitEnquiry` resolves the row,
 * snapshots the price and files the enquiry against the product — the same
 * path a detail-page enquiry takes.
 *
 * The whole catalogue is a few dozen rows of short strings. It is sent to the
 * browser once with the page rather than searched over the network, so typing
 * filters instantly and works with a bad signal in a river valley.
 */
export async function getEnquiryCatalogue(): Promise<EnquiryOptionGroup[]> {
  const [adventures, hotels, packages, rentals, destinations, closures] =
    await Promise.all([
      getAdventures(),
      getHotels(),
      getPackages(),
      getRentals(),
      getDestinations(),
      getClosures(),
    ]);

  /** Closed is stated, never hidden: a shut listing stays pickable and says so. */
  const adventureClosed = (kind: string, id: number) =>
    Boolean(
      resolveClosure(closures, {
        service: kind === "rafting" || kind === "bungee" ? kind : "activity",
        entityType: "adventure",
        entityId: id,
      }),
    );

  const rafting = adventures
    .filter((a) => a.kind === "rafting")
    .map<EnquiryOption>((a) => ({
      id: `rafting:${a.slug}`,
      kind: "rafting",
      slug: a.slug,
      name: a.name,
      group: "Rafting",
      meta: joinMeta(
        [a.distanceKm ? formatKm(a.distanceKm) : null, a.grade ? GRADE_LABEL[a.grade] : null],
        a.priceInr,
        "per person",
      ),
      closed: adventureClosed("rafting", a.id),
      keywords: keywords(a.name, "rafting river ganga", a.putInPoint, a.grade),
    }));

  const bungee = adventures
    .filter((a) => a.kind === "bungee")
    .map<EnquiryOption>((a) => ({
      id: `bungee:${a.slug}`,
      kind: "bungee",
      slug: a.slug,
      name: a.name,
      group: "Bungee",
      meta: joinMeta(
        [a.brand, a.heightM ? `${a.heightM} m` : null],
        a.priceInr,
        "per person",
      ),
      closed: adventureClosed("bungee", a.id),
      keywords: keywords(a.name, "bungee jump", a.brand),
    }));

  const activities = adventures
    .filter((a) => a.kind !== "rafting" && a.kind !== "bungee")
    .map<EnquiryOption>((a) => ({
      id: `${a.kind}:${a.slug}`,
      kind: a.kind,
      slug: a.slug,
      name: a.name,
      group: "Other adventures",
      meta: joinMeta([labelKind(a.kind)], a.priceInr, "per person"),
      closed: adventureClosed(a.kind, a.id),
      keywords: keywords(a.name, a.kind, a.bestFor),
    }));

  const packageOptions = packages.map<EnquiryOption>((p) => ({
    id: `package:${p.slug}`,
    kind: "package",
    slug: p.slug,
    name: p.name,
    group: "Holiday packages",
    // The route stays out of the line and in the search terms: a route label
    // carries its own separators, and three of them in one row is soup.
    meta: joinMeta(
      [p.durationLabel ?? (p.nights ? `${p.nights} nights` : null)],
      p.priceInr,
      "per person",
    ),
    closed: Boolean(resolveClosure(closures, { service: "package" })),
    keywords: keywords(p.name, "package tour yatra", p.category, p.routeLabel),
  }));

  const hotelOptions = hotels.map<EnquiryOption>((h) => ({
    id: `hotel:${h.slug}`,
    kind: "hotel",
    slug: h.slug,
    name: h.name,
    group: "Hotels & resorts",
    meta: joinMeta([h.locality], h.pricePerNightInr, "a night"),
    closed: Boolean(
      resolveClosure(closures, {
        service: "hotel",
        entityType: "hotel",
        entityId: h.id,
      }),
    ),
    keywords: keywords(h.name, "hotel resort stay room", h.locality, h.tagline),
  }));

  /**
   * A destination is a place, not a priced product, so there is no row for
   * `submitEnquiry` to resolve. It travels as a general enquiry with the place
   * as its subject, which is exactly what the owner needs to plan a quote.
   */
  const destinationOptions = destinations.map<EnquiryOption>((d) => ({
    id: `general:${d.slug}`,
    kind: "general",
    slug: "",
    name: d.name,
    group: "Destinations",
    meta: d.region,
    closed: false,
    keywords: keywords(d.name, "destination place trip", d.region, d.tagline),
  }));

  const rentalOptions = rentals.map<EnquiryOption>((r) => ({
    id: `rental:${r.slug}`,
    kind: "rental",
    slug: r.slug,
    name: r.name,
    group: "Car & bike rental",
    meta: r.quoteOnly
      ? `${labelKind(r.kind)}, on quote`
      : joinMeta([labelKind(r.kind)], r.perDayInr, "a day"),
    closed: Boolean(resolveClosure(closures, { service: "rental" })),
    keywords: keywords(r.name, `${r.kind} rental self drive scooty`, r.transmission),
  }));

  // Ordered the way the site's own nav reads, so the list is predictable to
  // anyone who arrived here from a listing page.
  return (
    [
      { label: "Rafting", options: rafting },
      { label: "Bungee", options: bungee },
      { label: "Other adventures", options: activities },
      { label: "Holiday packages", options: packageOptions },
      { label: "Hotels & resorts", options: hotelOptions },
      { label: "Destinations", options: destinationOptions },
      { label: "Car & bike rental", options: rentalOptions },
    ] satisfies EnquiryOptionGroup[]
  ).filter((g) => g.options.length > 0);
}

/** "16 km, Grade III" plus at most one price clause after a single separator. */
function joinMeta(
  facts: (string | null | undefined)[],
  price: number | null | undefined,
  unit: string,
): string | null {
  const left = facts.filter(Boolean).join(", ");
  const right =
    price === null || price === undefined ? null : `${formatINR(price)} ${unit}`;
  if (left && right) return `${left} · ${right}`;
  return left || right || null;
}

/** Same words as the GradeChip: a grade never travels without its label. */
const GRADE_LABEL = {
  easy: "Easy",
  moderate: "Moderate",
  challenging: "Challenging",
} as const;

function labelKind(kind: string): string {
  const labels: Record<string, string> = {
    paragliding: "Paragliding",
    zipline: "Zip-lining",
    car: "Car",
    bike: "Bike or scooty",
  };
  return labels[kind] ?? kind;
}

function keywords(...parts: (string | null | undefined)[]): string {
  return parts.filter(Boolean).join(" ").toLowerCase();
}
