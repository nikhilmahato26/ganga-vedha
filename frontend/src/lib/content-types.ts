/**
 * The public content shapes: what the API's public endpoints return and what every page renders.
 * Pure types with no imports, so the API Worker can share them (backend/src/services/content.ts).
 */

export type MediaSource = {
  /** Cloudinary secure_url, or any absolute URL. */
  src: string;
  alt: string;
  width?: number | null;
  height?: number | null;
  /** Tiny base64 LQIP from the media table, so a card never pops in blank. */
  placeholder?: string | null;
};

export type Grade = "easy" | "moderate" | "challenging";
/**
 * The three homepage service lines. These are the only values a closure scope
 * or a gallery category ever carries in the app, even though the underlying
 * `service_key` Postgres enum also has the enquiry-only kinds below.
 */
export type ServiceKey = "hotel" | "rafting" | "bungee";
/**
 * Every value the `service_key` enum can hold — the three services plus the
 * kinds that only appear as `enquiries.product_kind`.
 */
export type EnquiryKind =
  | "hotel"
  | "rafting"
  | "bungee"
  | "package"
  | "rental"
  | "activity"
  | "general";
export type AdventureKind = "rafting" | "bungee" | "paragliding" | "zipline";

export type Adventure = {
  id: number;
  kind: AdventureKind;
  slug: string;
  name: string;
  distanceKm: number | null;
  heightM: number | null;
  putInPoint: string | null;
  grade: Grade | null;
  durationMinutes: number;
  priceInr: number;
  compareAtPriceInr: number | null;
  rating: number | null;
  reviewCount: number | null;
  badge: string | null;
  bestFor: string | null;
  /** Operator / brand — bungee jumps are grouped by this on the site. */
  brand?: string | null;
  summary: string;
  description: string;
  inclusions: string[];
  exclusions: string[];
  whatToBring: string[];
  faqs: { q: string; a: string }[];
  meetingPoint: string;
  minAge: number | null;
  minWeightKg: number | null;
  maxWeightKg: number | null;
  rapids: string[];
  sortOrder: number;
  isPublished: boolean;
  /** Absent in seed mode — there is no database to have uploaded one to. */
  coverMedia?: MediaSource | null;
};

export type HotelRoom = {
  id: number;
  name: string;
  occupancy: number;
  bedType: string;
  pricePerNightInr: number;
  inclusions: string[];
  /** Absent in seed mode — there is no database to have uploaded one to. */
  coverMedia?: MediaSource | null;
};

export type Hotel = {
  id: number;
  slug: string;
  name: string;
  tagline: string;
  description: string;
  address: string;
  locality: string;
  /** Slug of the destination this stay sits in, for the /stays/[destination] page. */
  destinationSlug: string | null;
  mapUrl: string | null;
  starRating: number | null;
  pricePerNightInr: number;
  compareAtPriceInr: number | null;
  rating: number | null;
  reviewCount: number | null;
  badge: string | null;
  checkInTime: string;
  checkOutTime: string;
  amenities: string[];
  houseRules: string[];
  faqs: { q: string; a: string }[];
  rooms: HotelRoom[];
  sortOrder: number;
  isPublished: boolean;
  /** Absent in seed mode — there is no database to have uploaded one to. */
  coverMedia?: MediaSource | null;
  gallery?: MediaSource[];
};

export type Closure = {
  id: number;
  scope: "global" | "service" | "entity";
  serviceKey: ServiceKey | null;
  entityType: "adventure" | "hotel" | null;
  entityId: number | null;
  isActive: boolean;
  icon: "rain" | "wrench" | "calendar" | "alert";
  title: string;
  body: string;
  footnote: string | null;
  ctaLabel: string;
  version: number;
};

export type Review = {
  id: number;
  authorName: string;
  rating: number;
  body: string;
  tripLabel: string | null;
  /** "google" for a review copied from the Google Business listing; "manual" otherwise. */
  source?: string;
};

export type GalleryItem = {
  id: number;
  /** Reuses the same three services as everywhere else on the site; `null` is a photo that isn't specific to one of them. */
  category: ServiceKey | null;
  /** Free-text album — "Rafting", "Mountains", "Manali"… The gallery page groups by whatever values exist. */
  album: string | null;
  caption: string | null;
  media: MediaSource;
};

export type Destination = {
  id: number;
  slug: string;
  name: string;
  region: string | null;
  tagline: string;
  intro: string;
  highlights: string[];
  bestTime: string | null;
  howToReach: string | null;
  faqs: { q: string; a: string }[];
  coverMedia?: MediaSource | null;
  sortOrder: number;
  isPublished: boolean;
};

export type PackageItinerary = { title: string; detail: string };

export type Package = {
  id: number;
  slug: string;
  name: string;
  category: string | null;
  /** Slug of the primary destination, for cross-linking. */
  destinationSlug: string | null;
  durationLabel: string | null;
  nights: number | null;
  routeLabel: string | null;
  priceInr: number;
  compareAtPriceInr: number | null;
  priceNote: string | null;
  rating: number | null;
  reviewCount: number | null;
  badge: string | null;
  summary: string;
  description: string;
  itinerary: PackageItinerary[];
  inclusions: string[];
  exclusions: string[];
  accommodationNote: string | null;
  transportNote: string | null;
  mealsNote: string | null;
  terms: string[];
  faqs: { q: string; a: string }[];
  coverMedia?: MediaSource | null;
  sortOrder: number;
  isPublished: boolean;
};

export type Rental = {
  id: number;
  kind: "car" | "bike";
  slug: string;
  name: string;
  perDayInr: number | null;
  quoteOnly: boolean;
  depositInr: number | null;
  seats: number | null;
  transmission: string | null;
  fuelNote: string | null;
  summary: string;
  description: string;
  includes: string[];
  documentsRequired: string[];
  terms: string[];
  pickupNote: string | null;
  faqs: { q: string; a: string }[];
  coverMedia?: MediaSource | null;
  sortOrder: number;
  isPublished: boolean;
};

export type SiteSettings = {
  brandName: string;
  tagline: string;
  whatsappNumber: string;
  phone: string;
  email: string;
  address: string;
  mapUrl: string;
  heroHeading: string;
  heroSubheading: string;
  /** Absent in seed mode — there is no database to have uploaded one to. */
  heroMedia?: MediaSource | null;
  announcement: string | null;
  announcementActive: boolean;
  riverStatusLabel: string;
  gaugeLocation: string;
  /** The Google Business reviews link and its figures, as the owner last copied them from Google. */
  googleReviewsUrl?: string | null;
  googleRating?: number | null;
  googleReviewCount?: number | null;
};

export type Promotion = {
  id: number;
  title: string;
  body: string | null;
  ctaLabel: string | null;
  ctaHref: string | null;
  media: MediaSource | null;
};

export type WhyUsItem = { icon: string; title: string; body: string };

export type ContentBlock = {
  key: string;
  title: string | null;
  subtitle: string | null;
  body: string | null;
  items: WhyUsItem[];
  isActive: boolean;
};
