import "server-only";
import type { MediaSource } from "@/components/ui/media";

/**
 * The static fallback content layer.
 *
 * Used only when DATABASE_URL is not configured (a fresh clone, CI, a
 * contributor without Neon access). `@/lib/content` is what every page
 * actually imports — it queries Neon when available and falls back to this
 * module's data otherwise, so the site is always browsable.
 *
 * SEED CONTENT IS NOT PRODUCT TRUTH. The rafting stretches, put-in points and
 * distances are real Rishikesh geography. The prices, ratings, review counts
 * and hotel details are PLACEHOLDERS — never present them as Ganga Vedha's
 * real figures.
 */

export type Grade = "easy" | "moderate" | "challenging";
export type ServiceKey = "hotel" | "rafting" | "bungee";

export type Adventure = {
  id: number;
  kind: "rafting" | "bungee";
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
  announcement: string | null;
  announcementActive: boolean;
  riverStatusLabel: string;
  gaugeLocation: string;
};

/* ══════════════════════════════════════════════════════════════════════════
   SEED — replaced by Neon rows in Phase 1
   ══════════════════════════════════════════════════════════════════════════ */

const SETTINGS: SiteSettings = {
  brandName: "Ganga Vedha",
  tagline: "Rishikesh, by the kilometre",
  whatsappNumber: "9876543210",
  phone: "9876543210",
  email: "hello@gangavedha.com",
  address: "NH-34, Tapovan, Rishikesh, Uttarakhand 249192",
  mapUrl: "https://maps.google.com/?q=Tapovan+Rishikesh",
  heroHeading: "Every rapid has a number.\nSo does every limit.",
  heroSubheading:
    "Five rafting stretches on the Ganga, from a 12 km float to 32 km of big water. Distance, grade, price and age limit on every card — before you book, not after.",
  announcement: null,
  announcementActive: false,
  riverStatusLabel: "Running today",
  gaugeLocation: "Shivpuri",
};

const RAPIDS = {
  brahmpuri: ["Sweet Sixteen", "Hilton", "Body Surfing"],
  shivpuri: ["Three Blind Mice", "Cross Fire", "Roller Coaster", "Golf Course"],
  marine: ["The Wall", "Double Trouble", "Black Money", "Clubhouse"],
  kaudiyala: ["The Wall", "Daniel's Dip", "Three Blind Mice", "Cross Fire", "Roller Coaster"],
};

const COMMON_INCLUSIONS = [
  "Certified river guide in every raft",
  "Helmet, life jacket and paddle",
  "Safety kayaker on the run",
  "Changing rooms, showers and lockers at the base",
  "All river permits and entry fees",
];

const COMMON_EXCLUSIONS = [
  "GoPro and drone footage (add-on)",
  "Meals and refreshments",
  "Transport to the put-in point",
  "Personal expenses and tips",
];

const WHAT_TO_BRING = [
  "Quick-dry shorts or track pants",
  "A T-shirt you don't mind soaking",
  "Floaters or sandals with a back strap",
  "A towel and a full change of clothes",
  "Sunscreen and a valid photo ID",
];

const baseFaqs = (minAge: number) => [
  {
    q: "Do I need to know how to swim?",
    a: "No. Everyone wears a life jacket, a certified guide is in every raft and a safety kayaker runs alongside. Most of our first-timers can't swim.",
  },
  {
    q: `What is the minimum age?`,
    a: `${minAge} years for this stretch. The 12 km Brahmpuri run is the gentlest and takes children from 10 with a parent in the same raft.`,
  },
  {
    q: "What happens if the river is closed on my date?",
    a: "Rafting on the Ganga is suspended through the monsoon, usually from late June to mid-September. If your date falls in a closure we hold your enquiry and message you the moment bookings reopen.",
  },
  {
    q: "Can I keep my phone with me?",
    a: "No. Phones, wallets and keys go into a locker at the base — the water gets everywhere. Our guide carries a waterproof camera if you want photos.",
  },
];

const ADVENTURES: Adventure[] = [
  {
    id: 1,
    kind: "rafting",
    slug: "12-km-rafting-brahmpuri",
    name: "12 km from Brahmpuri",
    distanceKm: 12,
    heightM: null,
    putInPoint: "Brahmpuri",
    grade: "easy",
    durationMinutes: 120,
    priceInr: 1290,
    compareAtPriceInr: null,
    rating: 4.6,
    reviewCount: 288,
    badge: null,
    bestFor: "Best for beginners",
    summary:
      "A gentle introduction — scenic floats, warm calm water and three friendly rapids. The run families and first-timers should start on.",
    description:
      "Brahmpuri to NIM Beach is the shortest commercial stretch on the Ganga and the one we put nervous groups on. The rapids are real but forgiving, there are long calm pools between them for swimming and body surfing, and the whole thing is done inside two hours. If you have children, non-swimmers or someone who has spent the morning talking themselves out of it, this is the run.",
    inclusions: COMMON_INCLUSIONS,
    exclusions: COMMON_EXCLUSIONS,
    whatToBring: WHAT_TO_BRING,
    faqs: baseFaqs(10),
    meetingPoint:
      "Ganga Vedha base, Tapovan. We drive you up to the Brahmpuri put-in; report 45 minutes before your slot.",
    minAge: 10,
    minWeightKg: 30,
    maxWeightKg: 110,
    rapids: RAPIDS.brahmpuri,
    sortOrder: 1,
    isPublished: true,
  },
  {
    id: 2,
    kind: "rafting",
    slug: "16-km-rafting-shivpuri",
    name: "16 km from Shivpuri",
    distanceKm: 16,
    heightM: null,
    putInPoint: "Shivpuri",
    grade: "moderate",
    durationMinutes: 150,
    priceInr: 1590,
    compareAtPriceInr: 1890,
    rating: 4.8,
    reviewCount: 1129,
    badge: "Most popular",
    bestFor: "Best all-rounder",
    summary:
      "Splashy grade III rapids with calm stretches in between. The run most groups book, and the one we'd pick ourselves.",
    description:
      "Shivpuri to NIM Beach is the classic Rishikesh run and about seventy per cent of what we take out. You get four named rapids — Three Blind Mice, Cross Fire, Roller Coaster and Golf Course — with enough flat water between them to catch your breath, jump in, and let the guide talk. Big enough to feel like something happened, forgiving enough that nobody has a bad time.",
    inclusions: COMMON_INCLUSIONS,
    exclusions: COMMON_EXCLUSIONS,
    whatToBring: WHAT_TO_BRING,
    faqs: baseFaqs(14),
    meetingPoint:
      "Ganga Vedha base, Tapovan. Shuttle to the Shivpuri put-in; report 45 minutes before your slot.",
    minAge: 14,
    minWeightKg: 40,
    maxWeightKg: 110,
    rapids: RAPIDS.shivpuri,
    sortOrder: 2,
    isPublished: true,
  },
  {
    id: 3,
    kind: "rafting",
    slug: "24-km-rafting-marine-drive",
    name: "24 km from Marine Drive",
    distanceKm: 24,
    heightM: null,
    putInPoint: "Marine Drive",
    grade: "challenging",
    durationMinutes: 210,
    priceInr: 2490,
    compareAtPriceInr: 2900,
    rating: 4.7,
    reviewCount: 412,
    badge: null,
    bestFor: "Best for thrill seekers",
    summary:
      "Big water, cliff walls and very little flat river. Four hours on the Ganga with the volume turned up.",
    description:
      "Marine Drive puts you above The Wall and Double Trouble, the two rapids people actually come to Rishikesh for. This is a long day on big volume water with high canyon walls on both sides and no meaningful rest between the top rapids. We won't put a first-timer on it without a conversation, and we won't run it at all when the gauge is high.",
    inclusions: COMMON_INCLUSIONS,
    exclusions: COMMON_EXCLUSIONS,
    whatToBring: WHAT_TO_BRING,
    faqs: baseFaqs(16),
    meetingPoint:
      "Ganga Vedha base, Tapovan. Shuttle up to Marine Drive; report an hour before your slot.",
    minAge: 16,
    minWeightKg: 45,
    maxWeightKg: 110,
    rapids: RAPIDS.marine,
    sortOrder: 3,
    isPublished: true,
  },
  {
    id: 4,
    kind: "rafting",
    slug: "32-km-rafting-kaudiyala",
    name: "32 km from Kaudiyala",
    distanceKm: 32,
    heightM: null,
    putInPoint: "Kaudiyala",
    grade: "challenging",
    durationMinutes: 300,
    priceInr: 3290,
    compareAtPriceInr: null,
    rating: 4.9,
    reviewCount: 96,
    badge: "Longest run",
    bestFor: "Best for experienced rafters",
    summary:
      "The full river. Five hours, every named rapid on the stretch, and a lunch stop on the sand.",
    description:
      "Kaudiyala to NIM Beach is the longest commercial run on the Ganga and the closest thing Rishikesh has to an expedition day. You take every significant rapid on the river in sequence, stop on a beach for lunch, and finish tired. Previous rafting experience is not mandatory but it helps, and we cap group sizes lower on this one.",
    inclusions: [...COMMON_INCLUSIONS, "Riverside lunch on the sand"],
    exclusions: COMMON_EXCLUSIONS.filter((e) => !e.startsWith("Meals")),
    whatToBring: WHAT_TO_BRING,
    faqs: baseFaqs(18),
    meetingPoint:
      "Ganga Vedha base, Tapovan. Early shuttle to Kaudiyala; report at 7:00 am.",
    minAge: 18,
    minWeightKg: 45,
    maxWeightKg: 110,
    rapids: RAPIDS.kaudiyala,
    sortOrder: 4,
    isPublished: true,
  },
  {
    id: 5,
    kind: "bungee",
    slug: "bungee-jump-rishikesh",
    name: "Bungee jump, 83 m",
    distanceKm: null,
    heightM: 83,
    putInPoint: "Mohan Chatti",
    grade: "challenging",
    durationMinutes: 180,
    priceInr: 3700,
    compareAtPriceInr: null,
    rating: 4.8,
    reviewCount: 534,
    badge: null,
    bestFor: "Best for a story",
    summary:
      "Eighty-three metres off a cantilever platform over the Hyul valley. Three seconds of free fall.",
    description:
      "The platform is fixed to a rock cliff above the Hyul, a Ganga tributary, and everything on it is run by trained jump masters against a written checklist. You are weighed, harnessed, checked twice and then it is entirely up to you. Most people take about ninety seconds on the edge. Nobody regrets it afterwards.",
    inclusions: [
      "Jump master and full safety briefing",
      "Certified harness and body gear",
      "Weight check and medical screening",
      "Certificate of completion",
    ],
    exclusions: [
      "Jump video and photographs (add-on)",
      "Transport to the platform",
      "Meals and refreshments",
    ],
    whatToBring: [
      "Comfortable clothes you can move in",
      "Closed shoes — no sandals on the platform",
      "A valid photo ID",
    ],
    faqs: [
      {
        q: "What is the weight limit?",
        a: "40 kg to 110 kg. You are weighed at the site and the figure is written on your hand — it decides which cord you jump on, so it is not negotiable.",
      },
      {
        q: "Can I jump if I wear glasses?",
        a: "Take them off and leave them with the crew. Contact lenses are fine.",
      },
      {
        q: "Who cannot jump?",
        a: "Anyone pregnant, or with a heart condition, high blood pressure, epilepsy, recent fractures or a neurological condition. The screening at the site is the final word.",
      },
      {
        q: "Do I get a second attempt if I back out?",
        a: "You can take as long as you need on the platform. If you walk back down we refund half the fee — but almost nobody does.",
      },
    ],
    meetingPoint:
      "Jump site at Mohan Chatti, 25 km from Rishikesh. Report 30 minutes before your slot.",
    minAge: 12,
    minWeightKg: 40,
    maxWeightKg: 110,
    rapids: [],
    sortOrder: 5,
    isPublished: true,
  },
];

const HOTELS: Hotel[] = [
  {
    id: 1,
    slug: "ganga-vedha-riverside-camp",
    name: "Ganga Vedha Riverside Camp",
    tagline: "Swiss tents on the sand at Byasi, forty steps from the water",
    description:
      "Twelve twin-share Swiss tents pitched on a private beach at Byasi, upstream of the crowds. Each tent has a proper bed, an attached washroom and a veranda facing the river. Evenings are a bonfire on the sand and dinner off a single menu; mornings are quiet enough to hear the rapids. It is a ten-minute drive from the Shivpuri put-in, so the 16 km run is an easy add-on.",
    address: "Byasi Beach, NH-34, Byasi, Rishikesh, Uttarakhand 249303",
    locality: "Byasi",
    mapUrl: "https://maps.google.com/?q=Byasi+Rishikesh",
    starRating: 3,
    pricePerNightInr: 2200,
    compareAtPriceInr: 2800,
    rating: 4.7,
    reviewCount: 216,
    badge: "Closest to the river",
    checkInTime: "12:00 pm",
    checkOutTime: "10:00 am",
    amenities: [
      "Attached washroom",
      "Hot water",
      "All meals included",
      "Bonfire",
      "Parking",
      "Power backup",
      "Beach access",
      "Volleyball",
    ],
    houseRules: [
      "Alcohol is not permitted on the beach",
      "Quiet hours from 11:00 pm",
      "Valid photo ID required for every adult guest",
      "Couples and families welcome; unmarried couples permitted with ID",
    ],
    faqs: [
      {
        q: "Is the camp open during monsoon?",
        a: "No. The beach camp closes when the river rises, usually from late June to mid-September, and reopens with the rafting season.",
      },
      {
        q: "Are meals included?",
        a: "Yes — dinner on the night you arrive, breakfast and lunch the next day, all vegetarian, all off one menu.",
      },
      {
        q: "How far is the rafting put-in?",
        a: "Shivpuri is a ten-minute drive. We shuttle camp guests up for the 16 km run.",
      },
    ],
    rooms: [
      {
        id: 1,
        name: "Twin-share Swiss tent",
        occupancy: 2,
        bedType: "Two single beds",
        pricePerNightInr: 2200,
        inclusions: ["All meals", "Bonfire", "Attached washroom"],
      },
      {
        id: 2,
        name: "Family Swiss tent",
        occupancy: 4,
        bedType: "One double, two singles",
        pricePerNightInr: 3600,
        inclusions: ["All meals", "Bonfire", "Attached washroom", "River-facing veranda"],
      },
    ],
    sortOrder: 1,
    isPublished: true,
  },
  {
    id: 2,
    slug: "vedha-house-tapovan",
    name: "Vedha House, Tapovan",
    tagline: "A small guesthouse above Laxman Jhula, walkable to everything",
    description:
      "Eight rooms on three floors, five minutes' walk from Laxman Jhula and the Tapovan cafés. Not luxurious — clean, quiet, hot water that works, and a terrace where the whole building eats breakfast looking at the river. This is where we put people who want to be in town rather than on a beach.",
    address: "Badrinath Road, Tapovan, Rishikesh, Uttarakhand 249192",
    locality: "Tapovan",
    mapUrl: "https://maps.google.com/?q=Tapovan+Rishikesh",
    starRating: 3,
    pricePerNightInr: 1800,
    compareAtPriceInr: null,
    rating: 4.5,
    reviewCount: 143,
    badge: null,
    checkInTime: "1:00 pm",
    checkOutTime: "11:00 am",
    amenities: [
      "Free Wi-Fi",
      "Hot water",
      "Room service",
      "Terrace restaurant",
      "Parking",
      "Power backup",
      "Laundry",
      "Airport transfer on request",
    ],
    houseRules: [
      "Check-in from 1:00 pm, check-out by 11:00 am",
      "Valid photo ID required for every adult guest",
      "No smoking indoors",
      "Tapovan is a vegetarian zone — no meat or alcohol on the premises",
    ],
    faqs: [
      {
        q: "Is there a lift?",
        a: "No. The building is three floors and the stairs are steep — tell us when you book if that is a problem and we will keep you on the ground floor.",
      },
      {
        q: "Can you arrange rafting from here?",
        a: "Yes. Every stretch we run picks up from Tapovan, and the base is a four-minute walk.",
      },
    ],
    rooms: [
      {
        id: 3,
        name: "Standard double",
        occupancy: 2,
        bedType: "One double bed",
        pricePerNightInr: 1800,
        inclusions: ["Breakfast", "Wi-Fi", "Hot water"],
      },
      {
        id: 4,
        name: "River-view double",
        occupancy: 2,
        bedType: "One double bed",
        pricePerNightInr: 2400,
        inclusions: ["Breakfast", "Wi-Fi", "Balcony facing the Ganga"],
      },
      {
        id: 5,
        name: "Family room",
        occupancy: 4,
        bedType: "One double, two singles",
        pricePerNightInr: 3200,
        inclusions: ["Breakfast", "Wi-Fi", "Extra bathroom"],
      },
    ],
    sortOrder: 2,
    isPublished: true,
  },
];

/**
 * No closure is active in the seed, so the site ships open.
 * Flip `isActive` (or set CLOSE_RAFTING=1) to see the monsoon interstitial —
 * in Phase 6 this becomes a switch on the admin dashboard.
 */
const CLOSURES: Closure[] = [
  {
    id: 1,
    scope: "service",
    serviceKey: "rafting",
    entityType: null,
    entityId: null,
    isActive: process.env.CLOSE_RAFTING === "1",
    icon: "rain",
    title: "Rafting paused from mid-September",
    body: "Due to monsoon rains and high water levels on the Ganga, river rafting in Rishikesh is temporarily stopped for safety.",
    footnote: "Bookings reopen after the rains ease",
    ctaLabel: "Got it",
    version: 1,
  },
];

const REVIEWS: Review[] = [
  {
    id: 1,
    authorName: "Ishaan Mehra",
    rating: 5,
    body: "Booked the 16 km on a Saturday with eight of us, half of whom couldn't swim. The guide talked the nervous ones through every rapid before we hit it. Nobody wanted to get out at the end.",
    tripLabel: "16 km from Shivpuri",
  },
  {
    id: 2,
    authorName: "Priya Nair",
    rating: 5,
    body: "What sold me was that the site told me the age limit and the weight limit before I paid anything. Every other operator made me call to find out.",
    tripLabel: "12 km from Brahmpuri",
  },
  {
    id: 3,
    authorName: "Rohit Salunkhe",
    rating: 4,
    body: "24 km is a long day and they were honest about that on the phone. Double Trouble is no joke. Would do it again with a bit more sleep.",
    tripLabel: "24 km from Marine Drive",
  },
  {
    id: 4,
    authorName: "Ananya Bose",
    rating: 5,
    body: "Stayed two nights at the Byasi camp and rafted in the morning. Waking up on the sand with the river right there is the part I keep telling people about.",
    tripLabel: "Riverside Camp + 16 km",
  },
];

/* ══════════════════════════════════════════════════════════════════════════
   Accessors — the only thing pages import
   ══════════════════════════════════════════════════════════════════════════ */

export async function getSiteSettingsSeed(): Promise<SiteSettings> {
  return SETTINGS;
}

export async function getAdventuresSeed(kind?: "rafting" | "bungee"): Promise<Adventure[]> {
  return ADVENTURES.filter(
    (a) => a.isPublished && (kind ? a.kind === kind : true),
  ).sort((a, b) => a.sortOrder - b.sortOrder);
}

/** Rafting stretches ordered by the axis the whole product is sold on. */
export async function getRaftingByDistanceSeed(): Promise<Adventure[]> {
  const list = await getAdventuresSeed("rafting");
  return list.sort((a, b) => (a.distanceKm ?? 0) - (b.distanceKm ?? 0));
}

export async function getAdventureSeed(slug: string): Promise<Adventure | null> {
  return ADVENTURES.find((a) => a.slug === slug && a.isPublished) ?? null;
}

export async function getHotelsSeed(): Promise<Hotel[]> {
  return HOTELS.filter((h) => h.isPublished).sort((a, b) => a.sortOrder - b.sortOrder);
}

export async function getHotelSeed(slug: string): Promise<Hotel | null> {
  return HOTELS.find((h) => h.slug === slug && h.isPublished) ?? null;
}

export async function getReviewsSeed(): Promise<Review[]> {
  return REVIEWS;
}

export async function getClosuresSeed(): Promise<Closure[]> {
  return CLOSURES.filter((c) => c.isActive);
}
