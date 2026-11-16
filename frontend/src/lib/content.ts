import { ApiError, apiEnabled, apiGet } from "./api";
import { slugify } from "./format";
import { HERO_ROOMS_DEFAULT, type HeroRoomItem } from "./hero-rooms";
import type {
  Adventure,
  AdventureKind,
  Closure,
  ContentBlock,
  Destination,
  GalleryItem,
  Hotel,
  MediaSource,
  Package,
  Promotion,
  Rental,
  Review,
  SiteSettings,
} from "./content-types";

export type * from "./content-types";

/**
 * The content layer every page imports. Same function names as the original Next.js version.
 *
 * Calls the public API (backend/src/routes/public.ts) when VITE_API_URL is set; otherwise loads
 * the static seed in `content.seed.ts` (lazily, so it never ships in the API build's main chunk)
 * and the site stays browsable.
 *
 * Responses are memoised for a minute per tab, so moving between pages doesn't refetch the same
 * lists; the API's own Cache-Control keeps the edge copy fresh within a minute of an admin edit.
 */

const TTL_MS = 60_000;
const memo = new Map<string, { at: number; value: Promise<unknown> }>();

function cached<T>(key: string, load: () => Promise<T>): Promise<T> {
  const hit = memo.get(key);
  if (hit && Date.now() - hit.at < TTL_MS) return hit.value as Promise<T>;
  const value = load().catch((err) => {
    memo.delete(key);
    throw err;
  });
  memo.set(key, { at: Date.now(), value });
  return value;
}

/** GET a public endpoint; a 404 is `null` (an unpublished or deleted slug), anything else throws. */
function fetchJson<T>(path: string): Promise<T | null> {
  return cached(path, () =>
    apiGet<T>(path).catch((err) => {
      if (err instanceof ApiError && err.status === 404) return null;
      throw err;
    }),
  );
}

const seed = () => import("./content.seed");

/** True while the site is running on seed content instead of the API. */
export function isSeedContent(): boolean {
  return !apiEnabled;
}

export async function getSiteSettings(): Promise<SiteSettings> {
  if (!apiEnabled) return (await seed()).getSiteSettingsSeed();
  return (await fetchJson<SiteSettings>("/api/settings")) ?? (await seed()).getSiteSettingsSeed();
}

export async function getPromotions(): Promise<Promotion[]> {
  if (!apiEnabled) return (await seed()).getPromotionsSeed();
  return (await fetchJson<Promotion[]>("/api/promotions")) ?? [];
}

export async function getAdventures(kind?: AdventureKind): Promise<Adventure[]> {
  if (!apiEnabled) return (await seed()).getAdventuresSeed(kind);
  return (await fetchJson<Adventure[]>(kind ? `/api/adventures?kind=${kind}` : "/api/adventures")) ?? [];
}

/** The "Other adventures": paragliding, zip-lining and anything that isn't rafting or bungee. */
export async function getActivities(): Promise<Adventure[]> {
  const all = await getAdventures();
  return all.filter((a) => a.kind !== "rafting" && a.kind !== "bungee");
}

/** Distinct bungee operators, first-seen order, with a URL slug for `/adventures?brand=`. */
export async function getBungeeBrands(): Promise<{ name: string; slug: string }[]> {
  const list = await getAdventures("bungee");
  const bySlug = new Map<string, string>();
  for (const a of list) {
    const name = a.brand?.trim();
    if (!name) continue;
    const slug = slugify(name);
    if (slug && !bySlug.has(slug)) bySlug.set(slug, name);
  }
  return [...bySlug.entries()].map(([slug, name]) => ({ slug, name }));
}

/** Rafting stretches ordered by the axis the whole product is sold on. */
export async function getRaftingByDistance(): Promise<Adventure[]> {
  const list = await getAdventures("rafting");
  return [...list].sort((a, b) => (a.distanceKm ?? 0) - (b.distanceKm ?? 0));
}

export async function getAdventure(slug: string): Promise<Adventure | null> {
  if (!apiEnabled) return (await seed()).getAdventureSeed(slug);
  return fetchJson<Adventure>(`/api/adventures/${encodeURIComponent(slug)}`);
}

export async function getHotels(): Promise<Hotel[]> {
  if (!apiEnabled) return (await seed()).getHotelsSeed();
  return (await fetchJson<Hotel[]>("/api/hotels")) ?? [];
}

export async function getHotel(slug: string): Promise<Hotel | null> {
  if (!apiEnabled) return (await seed()).getHotelSeed(slug);
  return fetchJson<Hotel>(`/api/hotels/${encodeURIComponent(slug)}`);
}

export async function getReviews(): Promise<Review[]> {
  if (!apiEnabled) return (await seed()).getReviewsSeed();
  return (await fetchJson<Review[]>("/api/reviews")) ?? [];
}

/** All published gallery photos. Filtered client-side: the set is small enough for one request. */
export async function getGalleryItems(): Promise<GalleryItem[]> {
  if (!apiEnabled) return (await seed()).getGalleryItemsSeed();
  return (await fetchJson<GalleryItem[]>("/api/gallery")) ?? [];
}

export async function getClosures(): Promise<Closure[]> {
  if (!apiEnabled) return (await seed()).getClosuresSeed();
  return (await fetchJson<Closure[]>("/api/closures")) ?? [];
}

/** A named, admin-editable page section ("Why book with us" and the like). */
export async function getContentBlock(key: string): Promise<ContentBlock | null> {
  if (!apiEnabled) return null;
  return fetchJson<ContentBlock>(`/api/content-blocks/${encodeURIComponent(key)}`);
}

/** A hero room card ready to render: the stored item with its photo resolved. */
export type HeroRoom = Omit<HeroRoomItem, "mediaId" | "photo"> & { photo: MediaSource | null };

export async function getHeroRooms(): Promise<HeroRoom[]> {
  if (apiEnabled) {
    const rooms = await fetchJson<HeroRoom[]>("/api/hero-rooms");
    if (rooms) return rooms;
  }
  return HERO_ROOMS_DEFAULT.map(({ mediaId: _mediaId, photo, ...room }) => ({
    ...room,
    photo: photo ? { src: photo, alt: "" } : null,
  }));
}

export async function getDestinations(): Promise<Destination[]> {
  if (!apiEnabled) return (await seed()).getDestinationsSeed();
  return (await fetchJson<Destination[]>("/api/destinations")) ?? [];
}

export async function getDestination(slug: string): Promise<Destination | null> {
  if (!apiEnabled) return (await seed()).getDestinationSeed(slug);
  return fetchJson<Destination>(`/api/destinations/${encodeURIComponent(slug)}`);
}

export async function getPackages(): Promise<Package[]> {
  if (!apiEnabled) return (await seed()).getPackagesSeed();
  return (await fetchJson<Package[]>("/api/packages")) ?? [];
}

export async function getPackage(slug: string): Promise<Package | null> {
  if (!apiEnabled) return (await seed()).getPackageSeed(slug);
  return fetchJson<Package>(`/api/packages/${encodeURIComponent(slug)}`);
}

/** Published packages whose primary destination is this one. */
export async function getPackagesForDestination(destinationId: number): Promise<Package[]> {
  const [all, destinations] = await Promise.all([getPackages(), getDestinations()]);
  const slug = destinations.find((d) => d.id === destinationId)?.slug;
  return all.filter((p) => p.destinationSlug && p.destinationSlug === slug);
}

export async function getRentals(): Promise<Rental[]> {
  if (!apiEnabled) return (await seed()).getRentalsSeed();
  return (await fetchJson<Rental[]>("/api/rentals")) ?? [];
}

/** Distinct package categories, first-seen order, with a URL slug for `/packages?category=`. */
export async function getPackageCategories(): Promise<{ name: string; slug: string }[]> {
  const list = await getPackages();
  const bySlug = new Map<string, string>();
  for (const p of list) {
    const name = p.category?.trim();
    if (!name) continue;
    const slug = slugify(name);
    if (slug && !bySlug.has(slug)) bySlug.set(slug, name);
  }
  return [...bySlug.entries()].map(([slug, name]) => ({ slug, name }));
}

/** Which rental kinds have something published, cars first, so the nav never offers an empty list. */
export async function getRentalKinds(): Promise<{ kind: Rental["kind"]; count: number }[]> {
  const list = await getRentals();
  const counts = new Map<Rental["kind"], number>();
  for (const r of list) counts.set(r.kind, (counts.get(r.kind) ?? 0) + 1);
  return (["car", "bike"] as const)
    .filter((kind) => counts.has(kind))
    .map((kind) => ({ kind, count: counts.get(kind)! }));
}

export async function getRental(slug: string): Promise<Rental | null> {
  if (!apiEnabled) return (await seed()).getRentalSeed(slug);
  return fetchJson<Rental>(`/api/rentals/${encodeURIComponent(slug)}`);
}
