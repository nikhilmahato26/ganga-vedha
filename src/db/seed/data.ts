import type {
  adventures,
  destinations,
  hotels,
  hotelRooms,
  packages,
  rentals,
  siteSettings,
} from "@/db/schema";

/**
 * Seed data for `npm run db:seed`.
 *
 * The rafting geography (stretches, put-in points, distances, rapid names) is
 * real Rishikesh geography. Prices, ratings and review counts are PLACEHOLDER
 * values for the client to replace from the admin panel — never present them
 * as Ganga Vedha's real figures.
 *
 * Numeric/decimal columns (distanceKm, rating, lat, lng) are typed as strings
 * here because Drizzle's `numeric` column maps to `string` in insert/select
 * types by default — Postgres numeric has more precision than a JS `number`
 * can hold safely, so the driver never silently narrows it.
 */

type AdventureInsert = typeof adventures.$inferInsert;
type HotelInsert = typeof hotels.$inferInsert;
type SettingsInsert = Omit<typeof siteSettings.$inferInsert, "id">;
type DestinationInsert = typeof destinations.$inferInsert;
/** `destinationSlug` is resolved to `destinationId` by the seed script. */
type PackageInsert = Omit<typeof packages.$inferInsert, "destinationId"> & {
  destinationSlug: string | null;
};
type RentalInsert = typeof rentals.$inferInsert;

export const SETTINGS: SettingsInsert = {
  brandName: "Ganga Vedha",
  tagline: "Rishikesh, by the kilometre",
  whatsappNumber: "9876543210",
  phone: "9876543210",
  email: "hello@gangavedha.com",
  address: "NH-34, Tapovan, Rishikesh, Uttarakhand 249192",
  mapUrl: "https://maps.google.com/?q=Tapovan+Rishikesh",
  socials: {},
  heroHeading: "Every rapid has a number.\nSo does every limit.",
  heroSubheading:
    "Three stretches of the Ganga at Rishikesh — 12, 16 and 26 km. Distance, grade, price and age limit on every card, before you book, not after.",
  announcement: null,
  announcementActive: false,
  riverStatusLabel: "Running today",
  gaugeLocation: "Shivpuri",
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


const RAPIDS = {
  brahmpuri: ["Sweet Sixteen", "Hilton", "Body Surfing"],
  shivpuri: ["Three Blind Mice", "Cross Fire", "Roller Coaster", "Golf Course"],
  marine: ["The Wall", "Double Trouble", "Black Money", "Clubhouse"],
};

/** The Drone Craft tier is the same run with an aerial-video crew — footage in, add-on line out. */
const DRONE_INCLUSIONS = [...COMMON_INCLUSIONS, "Aerial drone video and photos of your run"];
const DRONE_EXCLUSIONS = COMMON_EXCLUSIONS.filter((e) => !e.startsWith("GoPro"));

const BUNGEE_INCLUSIONS = [
  "Jump master and full safety briefing",
  "Certified harness and body gear",
  "Weight check and medical screening",
  "Certificate of completion",
];
const BUNGEE_EXCLUSIONS = [
  "Jump video and photographs (add-on)",
  "Transport to the site",
  "Meals and refreshments",
];
const BUNGEE_BRING = [
  "Comfortable clothes you can move in",
  "Closed shoes — no sandals on the platform",
  "A valid photo ID",
];
const bungeeFaqs = (minW: number, maxW: number) => [
  {
    q: "What is the weight limit?",
    a: `${minW} kg to ${maxW} kg. You are weighed at the site and the figure is written on your hand — it decides which cord you jump on, so it is not negotiable.`,
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
    q: "Do I get a refund if I back out on the platform?",
    a: "You can take as long as you need on the edge. If you walk back down, most operators refund part of the fee — the exact policy is the operator's, and we confirm it when you book.",
  },
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
    q: "What is the minimum age?",
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

export const ADVENTURES: AdventureInsert[] = [
  /* ── Rishikesh · River Rafting (standard rate) ─────────────────────────── */
  {
    kind: "rafting",
    slug: "12-km-rafting-brahmpuri",
    name: "12 km from Brahmpuri",
    distanceKm: "12.0",
    heightM: null,
    putInPoint: "Brahmpuri",
    grade: "easy",
    durationMinutes: 120,
    priceInr: 400,
    compareAtPriceInr: null,
    rating: null,
    reviewCount: null,
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
    kind: "rafting",
    slug: "16-km-rafting-shivpuri",
    name: "16 km from Shivpuri",
    distanceKm: "16.0",
    heightM: null,
    putInPoint: "Shivpuri",
    grade: "moderate",
    durationMinutes: 150,
    priceInr: 600,
    compareAtPriceInr: null,
    rating: null,
    reviewCount: null,
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
    kind: "rafting",
    slug: "26-km-rafting-marine-drive",
    name: "26 km from Marine Drive",
    distanceKm: "26.0",
    heightM: null,
    putInPoint: "Marine Drive",
    grade: "challenging",
    durationMinutes: 210,
    priceInr: 1000,
    compareAtPriceInr: null,
    rating: null,
    reviewCount: null,
    badge: null,
    bestFor: "Best for thrill seekers",
    summary:
      "Big water, cliff walls and very little flat river. About four hours on the Ganga with the volume turned up.",
    description:
      "Marine Drive puts you above The Wall and Double Trouble, the two rapids people actually come to Rishikesh for. This is a long day on big volume water with high canyon walls on both sides and no meaningful rest between the top rapids. We won't put a first-timer on it without a conversation, and we won't run it at all when the gauge is high.",
    inclusions: COMMON_INCLUSIONS,
    exclusions: COMMON_EXCLUSIONS,
    whatToBring: WHAT_TO_BRING,
    faqs: baseFaqs(16),
    meetingPoint: "Ganga Vedha base, Tapovan. Shuttle up to Marine Drive; report an hour before your slot.",
    minAge: 16,
    minWeightKg: 45,
    maxWeightKg: 110,
    rapids: RAPIDS.marine,
    sortOrder: 3,
    isPublished: true,
  },
  /* ── Rishikesh · Drone Craft Rafting (same runs, aerial video included) ── */
  {
    kind: "rafting",
    slug: "12-km-rafting-brahmpuri-drone-craft",
    name: "12 km from Brahmpuri · Drone Craft",
    distanceKm: "12.0",
    heightM: null,
    putInPoint: "Brahmpuri",
    grade: "easy",
    durationMinutes: 120,
    priceInr: 999,
    compareAtPriceInr: null,
    rating: null,
    reviewCount: null,
    badge: "Aerial video included",
    bestFor: "Best for the footage",
    summary:
      "The 12 km Brahmpuri run with a drone crew filming you through every rapid — edited video and stills sent after.",
    description:
      "Exactly the same gentle Brahmpuri float, run with a Drone Craft aerial team on the bank. They fly your raft through each rapid and hand over an edited clip and photos afterwards. Pick this over the standard 12 km if the video is the point of the day.",
    inclusions: DRONE_INCLUSIONS,
    exclusions: DRONE_EXCLUSIONS,
    whatToBring: WHAT_TO_BRING,
    faqs: baseFaqs(10),
    meetingPoint:
      "Ganga Vedha base, Tapovan. Drive to the Brahmpuri put-in; the drone team meets you there. Report 45 minutes before your slot.",
    minAge: 10,
    minWeightKg: 30,
    maxWeightKg: 110,
    rapids: RAPIDS.brahmpuri,
    sortOrder: 4,
    isPublished: true,
  },
  {
    kind: "rafting",
    slug: "16-km-rafting-shivpuri-drone-craft",
    name: "16 km from Shivpuri · Drone Craft",
    distanceKm: "16.0",
    heightM: null,
    putInPoint: "Shivpuri",
    grade: "moderate",
    durationMinutes: 150,
    priceInr: 1600,
    compareAtPriceInr: null,
    rating: null,
    reviewCount: null,
    badge: "Aerial video included",
    bestFor: "Best for the footage",
    summary:
      "The classic 16 km Shivpuri run with a Drone Craft aerial team filming the four named rapids from above.",
    description:
      "The most-booked Rishikesh stretch, run with a drone crew tracking your raft through Three Blind Mice, Cross Fire, Roller Coaster and Golf Course. You get an edited video and stills after. Same water, same guides as the standard 16 km — the difference is the camera in the sky.",
    inclusions: DRONE_INCLUSIONS,
    exclusions: DRONE_EXCLUSIONS,
    whatToBring: WHAT_TO_BRING,
    faqs: baseFaqs(14),
    meetingPoint:
      "Ganga Vedha base, Tapovan. Shuttle to the Shivpuri put-in; the drone team meets you there. Report 45 minutes before your slot.",
    minAge: 14,
    minWeightKg: 40,
    maxWeightKg: 110,
    rapids: RAPIDS.shivpuri,
    sortOrder: 5,
    isPublished: true,
  },
  {
    kind: "rafting",
    slug: "26-km-rafting-marine-drive-drone-craft",
    name: "26 km from Marine Drive · Drone Craft",
    distanceKm: "26.0",
    heightM: null,
    putInPoint: "Marine Drive",
    grade: "challenging",
    durationMinutes: 210,
    priceInr: 2600,
    compareAtPriceInr: null,
    rating: null,
    reviewCount: null,
    badge: "Aerial video included",
    bestFor: "Best for the footage",
    summary:
      "The 26 km Marine Drive run — The Wall and Double Trouble — with a Drone Craft crew filming the whole way down.",
    description:
      "The long, big-water Marine Drive stretch with a drone team on the bank capturing every rapid, cliff wall and swim. Edited video and photos sent after. Book this if you want the footage of the hardest run we offer.",
    inclusions: DRONE_INCLUSIONS,
    exclusions: DRONE_EXCLUSIONS,
    whatToBring: WHAT_TO_BRING,
    faqs: baseFaqs(16),
    meetingPoint:
      "Ganga Vedha base, Tapovan. Shuttle up to Marine Drive; the drone team meets you there. Report an hour before your slot.",
    minAge: 16,
    minWeightKg: 45,
    maxWeightKg: 110,
    rapids: RAPIDS.marine,
    sortOrder: 6,
    isPublished: true,
  },
  /* ── Bungee jumping · operators from the workbook ─────────────────────── */
  {
    kind: "bungee",
    slug: "maa-ganga-bungy",
    name: "Maa Ganga Bungy",
    distanceKm: null,
    heightM: 83,
    putInPoint: "Shivpuri, Rishikesh",
    grade: "challenging",
    durationMinutes: 150,
    priceInr: 5000,
    compareAtPriceInr: null,
    rating: null,
    reviewCount: null,
    badge: null,
    bestFor: "Best riverside jump",
    summary:
      "A fixed-platform jump over the Ganga near Shivpuri, run by trained jump masters against a written checklist.",
    description:
      "The platform sits on the bank above the river at Shivpuri. You are weighed, harnessed and checked twice, then it is entirely up to you. Most people take a minute or so on the edge; almost nobody walks back down.",
    inclusions: BUNGEE_INCLUSIONS,
    exclusions: BUNGEE_EXCLUSIONS,
    whatToBring: BUNGEE_BRING,
    faqs: bungeeFaqs(40, 110),
    meetingPoint: "Jump site near Shivpuri, Rishikesh. Report 30 minutes before your slot.",
    minAge: 12,
    minWeightKg: 40,
    maxWeightKg: 110,
    rapids: [],
    sortOrder: 9,
    isPublished: true,
  },
  {
    kind: "bungee",
    slug: "himalayan-bungee",
    name: "Himalayan Bungee",
    distanceKm: null,
    heightM: 107,
    putInPoint: "Rishikesh",
    grade: "challenging",
    durationMinutes: 180,
    priceInr: 4500,
    compareAtPriceInr: null,
    rating: null,
    reviewCount: null,
    badge: "Highest platform",
    bestFor: "Best for the height",
    summary:
      "The tallest fixed-platform jump in the area — a long free fall before the cord takes up.",
    description:
      "Marketed as India's highest fixed-platform bungee. The extra height means a noticeably longer fall; the safety procedure — weigh-in, double harness check, medical screening — is the same as every other operator on this list.",
    inclusions: BUNGEE_INCLUSIONS,
    exclusions: BUNGEE_EXCLUSIONS,
    whatToBring: BUNGEE_BRING,
    faqs: bungeeFaqs(40, 110),
    meetingPoint: "Jump site near Rishikesh. Report 45 minutes before your slot.",
    minAge: 14,
    minWeightKg: 40,
    maxWeightKg: 110,
    rapids: [],
    sortOrder: 10,
    isPublished: true,
  },
  {
    kind: "bungee",
    slug: "splash-bungy",
    name: "Splash Bungy",
    distanceKm: null,
    heightM: 25,
    putInPoint: "Rishikesh",
    grade: "moderate",
    durationMinutes: 90,
    priceInr: 4000,
    compareAtPriceInr: null,
    rating: null,
    reviewCount: null,
    badge: null,
    bestFor: "Best first jump",
    summary:
      "A lower jump where you touch the water at the bottom of the fall — the gentle way into bungee.",
    description:
      "A shorter drop than the big platforms, ending with a dip into the water before the rebound. A good first bungee for someone who wants the experience without the full height. Confirm the exact height and water-touch with the operator when you book.",
    inclusions: BUNGEE_INCLUSIONS,
    exclusions: BUNGEE_EXCLUSIONS,
    whatToBring: [...BUNGEE_BRING, "A change of clothes — you will get wet"],
    faqs: bungeeFaqs(35, 110),
    meetingPoint: "Jump site near Rishikesh. Report 30 minutes before your slot.",
    minAge: 10,
    minWeightKg: 35,
    maxWeightKg: 110,
    rapids: [],
    sortOrder: 11,
    isPublished: true,
  },
  {
    kind: "bungee",
    slug: "jumpin-height",
    name: "Jumpin Height",
    distanceKm: null,
    heightM: 83,
    putInPoint: "Mohan Chatti, Rishikesh",
    grade: "challenging",
    durationMinutes: 180,
    priceInr: 4500,
    compareAtPriceInr: null,
    rating: null,
    reviewCount: null,
    badge: "Most popular",
    bestFor: "Best-known operator",
    summary:
      "The cantilever platform over the Hyul valley at Mohan Chatti — the most-booked bungee out of Rishikesh.",
    description:
      "The platform is fixed to a rock cliff above the Hyul, a Ganga tributary, 25 km from town. Everything is run by trained jump masters against a written checklist. You are weighed, harnessed, checked twice, and then it is entirely up to you.",
    inclusions: BUNGEE_INCLUSIONS,
    exclusions: BUNGEE_EXCLUSIONS,
    whatToBring: BUNGEE_BRING,
    faqs: bungeeFaqs(40, 110),
    meetingPoint: "Jump site at Mohan Chatti, 25 km from Rishikesh. Report 30 minutes before your slot.",
    minAge: 12,
    minWeightKg: 40,
    maxWeightKg: 110,
    rapids: [],
    sortOrder: 12,
    isPublished: true,
  },
  {
    kind: "bungee",
    slug: "thrill-factory-rishikesh",
    name: "Thrill Factory Rishikesh",
    distanceKm: null,
    heightM: 83,
    putInPoint: "Rishikesh",
    grade: "challenging",
    durationMinutes: 150,
    priceInr: 3000,
    compareAtPriceInr: null,
    rating: null,
    reviewCount: null,
    badge: "Lowest price",
    bestFor: "Best value",
    summary:
      "A fixed-platform jump near Rishikesh at the lowest price of the operators we list.",
    description:
      "Same core safety procedure — weigh-in, double harness check, medical screening — at a lower fee than the better-known platforms. We confirm the operator's current certification and jump log before booking you in.",
    inclusions: BUNGEE_INCLUSIONS,
    exclusions: BUNGEE_EXCLUSIONS,
    whatToBring: BUNGEE_BRING,
    faqs: bungeeFaqs(40, 110),
    meetingPoint: "Jump site near Rishikesh. Report 30 minutes before your slot.",
    minAge: 12,
    minWeightKg: 40,
    maxWeightKg: 110,
    rapids: [],
    sortOrder: 13,
    isPublished: true,
  },
  {
    kind: "bungee",
    slug: "himalayan-bungy-jim-corbett",
    name: "Himalayan Bungy · Jim Corbett",
    distanceKm: null,
    heightM: 83,
    putInPoint: "Jim Corbett",
    grade: "challenging",
    durationMinutes: 150,
    priceInr: 4500,
    compareAtPriceInr: null,
    rating: null,
    reviewCount: null,
    badge: null,
    bestFor: "Best outside Rishikesh",
    summary:
      "A fixed-platform jump near the Jim Corbett national park, for trips based in the Kumaon hills.",
    description:
      "The same style of cantilever-platform jump as Rishikesh, run near Corbett so you can add it to a safari trip without doubling back. Weigh-in, harness check and medical screening on site.",
    inclusions: BUNGEE_INCLUSIONS,
    exclusions: BUNGEE_EXCLUSIONS,
    whatToBring: BUNGEE_BRING,
    faqs: bungeeFaqs(40, 110),
    meetingPoint: "Jump site near Ramnagar / Jim Corbett. Report 30 minutes before your slot.",
    minAge: 12,
    minWeightKg: 40,
    maxWeightKg: 110,
    rapids: [],
    sortOrder: 14,
    isPublished: true,
  },
  {
    kind: "paragliding",
    slug: "tandem-paragliding",
    name: "Tandem paragliding",
    distanceKm: null,
    heightM: null,
    putInPoint: "Hill take-off site",
    grade: "moderate",
    durationMinutes: 45,
    priceInr: 10000,
    compareAtPriceInr: null,
    rating: null,
    reviewCount: null,
    badge: null,
    bestFor: "Best for the view",
    summary:
      "A tandem flight strapped to a certified pilot — a short uphill drive to the launch, then 15 to 30 minutes in the air depending on the wind, landing down in the valley.",
    description:
      "You fly with a licensed tandem pilot who handles the wing the whole way; your job is to run a few steps at take-off and enjoy the rest. Airtime depends entirely on the wind on the day — we quote a range, never a promise. Flights are weather-dependent and can be moved or refunded if the site is not flyable.",
    inclusions: [
      "Certified tandem pilot",
      "Full harness, helmet and wing",
      "Short safety briefing before take-off",
      "Pick-up from the landing field back to the meeting point",
    ],
    exclusions: [
      "In-flight video and photos (add-on)",
      "Transport to the meeting point",
      "Meals and refreshments",
    ],
    whatToBring: [
      "Closed shoes you can run a few steps in",
      "A light jacket — it is cooler at altitude",
      "Sunglasses and a valid photo ID",
    ],
    faqs: [
      {
        q: "How long is the flight?",
        a: "Between 15 and 30 minutes of airtime, decided by the wind on the day. We tell you the likely window at the meeting point, not before.",
      },
      {
        q: "What is the weight limit?",
        a: "Roughly 25 kg to 100 kg. Outside that range the wing and harness cannot be set up safely, and the pilot's decision at the site is final.",
      },
      {
        q: "What if the weather is bad?",
        a: "Paragliding only runs in a safe wind window. If the site is not flyable on your slot we move you to another time or refund the flight in full.",
      },
    ],
    meetingPoint:
      "Meeting point in Rishikesh; a shared vehicle takes you up to the take-off site. Report 45 minutes before your slot.",
    minAge: 12,
    minWeightKg: 25,
    maxWeightKg: 100,
    rapids: [],
    sortOrder: 15,
    isPublished: true,
  },
  {
    kind: "zipline",
    slug: "zip-line",
    name: "Zip line",
    distanceKm: null,
    heightM: null,
    putInPoint: "Valley crossing",
    grade: "easy",
    durationMinutes: 30,
    priceInr: 2500,
    compareAtPriceInr: null,
    rating: null,
    reviewCount: null,
    badge: null,
    bestFor: "Best quick thrill",
    summary:
      "A fixed steel line across the valley, ridden on a pulley harness with a mechanical brake and a trained operator at each end. On and done inside half an hour.",
    description:
      "The line, harness and braking system are checked before every session and the crew clip you in and send you off — there is nothing to operate yourself. It is the gentlest thing we run: no swimming, no free fall, and a minimum age of 10. A good first activity for a group with mixed nerves.",
    inclusions: [
      "Full-body harness, helmet and gloves",
      "Trained operator at both ends",
      "Equipment check before every session",
    ],
    exclusions: ["Photos and video (add-on)", "Transport to the site", "Meals and refreshments"],
    whatToBring: ["Closed shoes", "Clothes you can move in", "A valid photo ID"],
    faqs: [
      {
        q: "Is there an age limit?",
        a: "10 years and up. Under 16s ride with a parent's consent and the operator's sign-off at the site.",
      },
      {
        q: "Do I need any experience?",
        a: "None. The crew clip you in, brief you in a minute, and control the ride from both ends.",
      },
    ],
    meetingPoint: "Report at the zip-line site 20 minutes before your slot.",
    minAge: 10,
    minWeightKg: 30,
    maxWeightKg: 120,
    rapids: [],
    sortOrder: 16,
    isPublished: true,
  },
];

export const HOTELS: (HotelInsert & {
  rooms: Omit<typeof hotelRooms.$inferInsert, "hotelId">[];
  /** Resolved to `destinationId` by the seed script. */
  destinationSlug: string | null;
})[] = [
  {
    slug: "ganga-vedha-riverside-camp",
    name: "Ganga Vedha Riverside Camp",
    tagline: "Swiss tents on the sand at Byasi, forty steps from the water",
    description:
      "Twelve twin-share Swiss tents pitched on a private beach at Byasi, upstream of the crowds. Each tent has a proper bed, an attached washroom and a veranda facing the river. Evenings are a bonfire on the sand and dinner off a single menu; mornings are quiet enough to hear the rapids. It is a ten-minute drive from the Shivpuri put-in, so the 16 km run is an easy add-on.",
    address: "Byasi Beach, NH-34, Byasi, Rishikesh, Uttarakhand 249303",
    locality: "Byasi",
    lat: "30.108500",
    lng: "78.454200",
    destinationSlug: "rishikesh",
    mapUrl: "https://maps.google.com/?q=Byasi+Rishikesh",
    starRating: 3,
    pricePerNightInr: 2200,
    compareAtPriceInr: 2800,
    rating: "4.7",
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
    sortOrder: 1,
    isPublished: true,
    rooms: [
      {
        name: "Twin-share Swiss tent",
        occupancy: 2,
        bedType: "Two single beds",
        pricePerNightInr: 2200,
        inclusions: ["All meals", "Bonfire", "Attached washroom"],
        sortOrder: 1,
      },
      {
        name: "Family Swiss tent",
        occupancy: 4,
        bedType: "One double, two singles",
        pricePerNightInr: 3600,
        inclusions: ["All meals", "Bonfire", "Attached washroom", "River-facing veranda"],
        sortOrder: 2,
      },
    ],
  },
  {
    slug: "vedha-house-tapovan",
    name: "Vedha House, Tapovan",
    tagline: "A small guesthouse above Laxman Jhula, walkable to everything",
    description:
      "Eight rooms on three floors, five minutes' walk from Laxman Jhula and the Tapovan cafés. Not luxurious — clean, quiet, hot water that works, and a terrace where the whole building eats breakfast looking at the river. This is where we put people who want to be in town rather than on a beach.",
    address: "Badrinath Road, Tapovan, Rishikesh, Uttarakhand 249192",
    locality: "Tapovan",
    lat: "30.132400",
    lng: "78.301900",
    destinationSlug: "rishikesh",
    mapUrl: "https://maps.google.com/?q=Tapovan+Rishikesh",
    starRating: 3,
    pricePerNightInr: 1800,
    compareAtPriceInr: null,
    rating: "4.5",
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
    sortOrder: 2,
    isPublished: true,
    rooms: [
      {
        name: "Standard double",
        occupancy: 2,
        bedType: "One double bed",
        pricePerNightInr: 1800,
        inclusions: ["Breakfast", "Wi-Fi", "Hot water"],
        sortOrder: 1,
      },
      {
        name: "River-view double",
        occupancy: 2,
        bedType: "One double bed",
        pricePerNightInr: 2400,
        inclusions: ["Breakfast", "Wi-Fi", "Balcony facing the Ganga"],
        sortOrder: 2,
      },
      {
        name: "Family room",
        occupancy: 4,
        bedType: "One double, two singles",
        pricePerNightInr: 3200,
        inclusions: ["Breakfast", "Wi-Fi", "Extra bathroom"],
        sortOrder: 3,
      },
    ],
  },
];

export const REVIEWS = [
  {
    authorName: "Ishaan Mehra",
    rating: 5,
    body: "Booked the 16 km on a Saturday with eight of us, half of whom couldn't swim. The guide talked the nervous ones through every rapid before we hit it. Nobody wanted to get out at the end.",
    tripLabel: "16 km from Shivpuri",
    source: "manual",
    isPublished: true,
    sortOrder: 1,
  },
  {
    authorName: "Priya Nair",
    rating: 5,
    body: "What sold me was that the site told me the age limit and the weight limit before I paid anything. Every other operator made me call to find out.",
    tripLabel: "12 km from Brahmpuri",
    source: "manual",
    isPublished: true,
    sortOrder: 2,
  },
  {
    authorName: "Rohit Salunkhe",
    rating: 4,
    body: "24 km is a long day and they were honest about that on the phone. Double Trouble is no joke. Would do it again with a bit more sleep.",
    tripLabel: "26 km from Marine Drive",
    source: "manual",
    isPublished: true,
    sortOrder: 3,
  },
  {
    authorName: "Ananya Bose",
    rating: 5,
    body: "Stayed two nights at the Byasi camp and rafted in the morning. Waking up on the sand with the river right there is the part I keep telling people about.",
    tripLabel: "Riverside Camp + 16 km",
    source: "manual",
    isPublished: true,
    sortOrder: 4,
  },
];

/**
 * The ten destinations from the blueprint. Geography and travel notes are real;
 * anything price-shaped lives on the linked stays and packages.
 */
export const DESTINATIONS: DestinationInsert[] = [
  {
    slug: "haridwar",
    name: "Haridwar",
    region: "Uttarakhand",
    tagline: "Where the Ganga leaves the mountains",
    intro:
      "The gateway town for the Char Dham and Do Dham yatras and the site of the evening Ganga Aarti at Har Ki Pauri. Most pilgrimage itineraries start and end here because it is the last town with a full railhead before the hills.",
    highlights: [
      "Ganga Aarti at Har Ki Pauri after sunset",
      "Chandi Devi and Mansa Devi temples by ropeway",
      "Starting point for Char Dham and Do Dham road trips",
    ],
    bestTime: "September to April; avoid the peak yatra rush of May–June if you can",
    howToReach:
      "Direct trains from Delhi (about 4–5 hours) and a road transfer from Dehradun's Jolly Grant airport (about 35 km).",
    faqs: [
      {
        q: "Is Haridwar the same as Rishikesh?",
        a: "No — they are about 20 km apart. Haridwar is the pilgrimage and railhead town; Rishikesh is the adventure and yoga town upstream.",
      },
    ],
    sortOrder: 1,
    isPublished: true,
  },
  {
    slug: "rishikesh",
    name: "Rishikesh",
    region: "Uttarakhand",
    tagline: "Rafting, yoga and the jhula bridges",
    intro:
      "Our home base. Rafting on the Ganga, bungee and zip-line sites in the side valleys, riverside cafés around Laxman Jhula and Tapovan, and the yoga schools that gave the town its second name.",
    highlights: [
      "Grade II–IV rafting from 12 km to 32 km stretches",
      "Bungee, zip-line and paragliding within a short drive",
      "Beatles Ashram, Triveni Ghat aarti and the Tapovan café strip",
    ],
    bestTime: "Mid-September to mid-June for rafting; the river closes through the monsoon",
    howToReach:
      "About 20 km from Haridwar, 45 minutes from Dehradun's Jolly Grant airport, and an overnight bus or train from Delhi.",
    faqs: [
      {
        q: "When does rafting stop?",
        a: "Through the monsoon, usually late June to mid-September, when the water is too high to run safely.",
      },
    ],
    sortOrder: 2,
    isPublished: true,
  },
  {
    slug: "dehradun",
    name: "Dehradun",
    region: "Uttarakhand",
    tagline: "The valley capital and the region's airport",
    intro:
      "The state capital and the arrival point for most trips into Uttarakhand — Jolly Grant airport is here. A relaxed valley city with Robber's Cave, the Forest Research Institute and a short climb up to Mussoorie.",
    highlights: [
      "Jolly Grant airport — the gateway to Rishikesh, Mussoorie and the hills",
      "Robber's Cave (Guchhupani) and Sahastradhara springs",
      "Forest Research Institute's colonial-era campus",
    ],
    bestTime: "All year; October to March is coolest",
    howToReach: "Flights from Delhi, Mumbai and Bengaluru; the Shatabdi from Delhi takes about 6 hours.",
    faqs: [],
    sortOrder: 3,
    isPublished: true,
  },
  {
    slug: "mussoorie",
    name: "Mussoorie",
    region: "Uttarakhand",
    tagline: "The Queen of the Hills, an hour above Dehradun",
    intro:
      "A classic colonial hill station on a ridge above the Doon valley — Mall Road, Gun Hill, Kempty Falls and long views to the snow line on a clear morning. Pairs naturally with Rishikesh on a short Uttarakhand loop.",
    highlights: [
      "Camel's Back Road walk and the Gun Hill ropeway",
      "Kempty Falls and Landour's quiet upper bazaar",
      "Sunset over the Doon valley from the Mall",
    ],
    bestTime: "March to June and September to November; December–January for snow",
    howToReach: "About 35 km and 1.5 hours by road from Dehradun.",
    faqs: [],
    sortOrder: 4,
    isPublished: true,
  },
  {
    slug: "tehri-lake",
    name: "Tehri Lake",
    region: "Uttarakhand",
    tagline: "A reservoir the size of a small sea",
    intro:
      "The lake behind the Tehri Dam, now a watersports centre — jet-skiing, boating and a growing cluster of floating huts. A calm-water contrast to the whitewater downstream at Rishikesh.",
    highlights: [
      "Jet-ski, banana-boat and kayaking on flat water",
      "Floating huts and lakeside camps",
      "The dam viewpoint and the old-Tehri story",
    ],
    bestTime: "March to June and September to November",
    howToReach: "About 90 km from Rishikesh, 3 to 4 hours by road via Chamba.",
    faqs: [],
    sortOrder: 5,
    isPublished: true,
  },
  {
    slug: "nainital",
    name: "Nainital",
    region: "Uttarakhand",
    tagline: "A lake town in the Kumaon hills",
    intro:
      "Built around Naini Lake, with boating from the Mallital and Tallital ends, a Mall Road along the water and the Snow View and Tiffin Top viewpoints above. The usual base for a Kumaon trip that also takes in Jim Corbett and Mukteshwar.",
    highlights: [
      "Rowing and pedal boats on Naini Lake",
      "Snow View and Tiffin Top by ropeway or pony",
      "Naina Devi temple on the north shore",
    ],
    bestTime: "March to June and September to November",
    howToReach: "Nearest railhead is Kathgodam (about 35 km); road from Delhi is 300 km, 7 to 8 hours.",
    faqs: [],
    sortOrder: 6,
    isPublished: true,
  },
  {
    slug: "jim-corbett",
    name: "Jim Corbett",
    region: "Uttarakhand",
    tagline: "India's oldest national park",
    intro:
      "Tiger country in the Kumaon foothills, run as a set of zones — Dhikala, Bijrani, Jhirna and others — each with its own permit and gate timings. Safaris are by registered jeep with a forest guide; bookings open a fixed number of days ahead.",
    highlights: [
      "Jeep safaris in the Bijrani and Jhirna zones",
      "Dhikala's grassland and the Ramganga riverbed",
      "Corbett Museum at Kaladhungi",
    ],
    bestTime: "November to June; core zones like Dhikala are closed in the monsoon",
    howToReach: "Ramnagar is the gateway town and railhead; about 250 km and 6 hours from Delhi.",
    faqs: [
      {
        q: "Do safaris need to be booked in advance?",
        a: "Yes. Zone permits are limited and sell out, especially on weekends and holidays. Tell us your dates early and we'll arrange the permit and jeep.",
      },
    ],
    sortOrder: 7,
    isPublished: true,
  },
  {
    slug: "mukteshwar",
    name: "Mukteshwar",
    region: "Uttarakhand",
    tagline: "Orchards, pine and a straight look at the Himalaya",
    intro:
      "A quiet ridge village at 2,285 m, known for its 350-year-old Shiva temple, the cliff-edge 'Chauli Ki Jali' rocks and one of the cleanest Himalayan skylines in Kumaon. A slow-paced stop on a Nainital trip.",
    highlights: [
      "Panoramic Himalayan views on a clear morning",
      "Chauli Ki Jali cliffs and short rappelling",
      "Fruit orchards and pine-forest walks",
    ],
    bestTime: "March to June and September to November; clear skies after monsoon",
    howToReach: "About 50 km from Nainital, 2 hours by road.",
    faqs: [],
    sortOrder: 8,
    isPublished: true,
  },
  {
    slug: "manali",
    name: "Manali",
    region: "Himachal Pradesh",
    tagline: "Rafting, snow and the road to the passes",
    intro:
      "The head of the Kullu valley on the Beas river — day trips to Solang and the Atal Tunnel, the Old Manali cafés, and the base for Rohtang and Spiti in season.",
    highlights: [
      "Solang Valley — ropeway, and zip line and paragliding in season",
      "Solang Valley, Atal Tunnel and Sissu day trips",
      "Old Manali cafés and the Hadimba temple in deodar forest",
    ],
    bestTime: "March to June for rafting and greenery; December to February for snow",
    howToReach: "Overnight Volvo from Delhi (about 12–14 hours); nearest airport is Bhuntar, 50 km south.",
    faqs: [],
    sortOrder: 9,
    isPublished: true,
  },
  {
    slug: "shimla",
    name: "Shimla",
    region: "Himachal Pradesh",
    tagline: "The old summer capital on a seven-hill ridge",
    intro:
      "Colonial-era Shimla — the Ridge, Mall Road, Christ Church and the toy train up from Kalka — usually paired with Manali on a Himachal loop. Kufri and Chail are short drives out.",
    highlights: [
      "The Ridge, Mall Road and Scandal Point",
      "Kalka–Shimla toy train, a UNESCO line",
      "Day trips to Kufri and Chail",
    ],
    bestTime: "March to June and September to November; December–January for snow",
    howToReach: "About 350 km from Delhi; toy train from Kalka, or road via Chandigarh.",
    faqs: [],
    sortOrder: 10,
    isPublished: true,
  },
];

/**
 * Holiday packages. Prices are the client's stated "starting from" figures —
 * confirm current pricing and inclusions before publishing.
 */
export const PACKAGES: PackageInsert[] = [
  {
    slug: "yoga-classes-course",
    name: "Yoga Classes Course",
    category: "Yoga & wellness",
    destinationSlug: "rishikesh",
    durationLabel: "7 days",
    nights: 6,
    routeLabel: "Rishikesh",
    priceInr: 10000,
    compareAtPriceInr: null,
    priceNote: "per person, course fee",
    rating: null,
    reviewCount: null,
    badge: null,
    summary:
      "A week of guided yoga and pranayama in Rishikesh — two sessions a day with a resident teacher, plus philosophy and meditation. Suitable for beginners.",
    description:
      "A structured seven-day course at a Rishikesh yoga school: morning asana and pranayama, an afternoon session on alignment or meditation, and short talks on yoga philosophy. Small groups, mats provided, and a pace that assumes no prior experience. Accommodation and meals can be added — ask when you enquire.",
    itinerary: [
      { title: "Day 1", detail: "Arrival, orientation, gentle evening session and a walk to the Triveni Ghat aarti." },
      { title: "Days 2–6", detail: "Morning asana and pranayama, afternoon alignment or meditation, evening philosophy talk." },
      { title: "Day 7", detail: "Closing practice, feedback and course certificate. Late checkout on request." },
    ],
    inclusions: [
      "Two guided sessions a day for six days",
      "Meditation and philosophy sessions",
      "Yoga mats and props",
      "Course certificate",
    ],
    exclusions: ["Accommodation and meals (add-on)", "Travel to Rishikesh", "Personal expenses"],
    accommodationNote:
      "Not included in the base fee — we can book an ashram room or a nearby guesthouse on request.",
    transportNote: "Not included. We can arrange an airport or station pickup for an extra charge.",
    mealsNote: "Not included in the base fee; sattvic meal plans available if you stay at the school.",
    terms: [
      "Full payment confirms the seat; the course runs on fixed start dates.",
      "Rescheduling is free up to 14 days before the start date.",
    ],
    faqs: [
      {
        q: "Is this a teacher-training course?",
        a: "No. This is a practice course for your own benefit, not a certified 200-hour TTC. Tell us if you want the TTC option and we'll quote separately.",
      },
    ],
    sortOrder: 1,
    isPublished: true,
  },
  {
    slug: "char-dham-yatra",
    name: "Char Dham Yatra",
    category: "Pilgrimage",
    destinationSlug: "haridwar",
    durationLabel: "10 nights / 11 days",
    nights: 10,
    routeLabel: "Yamunotri · Gangotri · Kedarnath · Badrinath",
    priceInr: 45000,
    compareAtPriceInr: null,
    priceNote: "per person, twin sharing",
    rating: null,
    reviewCount: null,
    badge: "Fixed departures",
    summary:
      "The full four-shrine circuit from Haridwar — Yamunotri, Gangotri, Kedarnath and Badrinath — with hotels, transport, and the Kedarnath trek or pony arranged.",
    description:
      "An 11-day road pilgrimage covering all four dhams in the traditional order, starting and ending at Haridwar. The Kedarnath leg involves a 16 km trek from Gaurikund (pony, palki and helicopter options are extra). Itinerary and night halts shift with road and weather conditions in the high Himalaya.",
    itinerary: [
      { title: "Day 1", detail: "Arrive Haridwar. Ganga Aarti at Har Ki Pauri. Overnight Haridwar." },
      { title: "Day 2", detail: "Drive to Barkot via Mussoorie. Overnight Barkot." },
      { title: "Day 3", detail: "Yamunotri darshan (6 km trek each way from Janki Chatti). Overnight Barkot." },
      { title: "Day 4", detail: "Drive to Uttarkashi. Overnight Uttarkashi." },
      { title: "Day 5", detail: "Gangotri darshan, return to Uttarkashi. Overnight Uttarkashi." },
      { title: "Day 6", detail: "Drive to Guptkashi/Sitapur. Overnight." },
      { title: "Day 7", detail: "Drive to Sonprayag, trek/pony 16 km to Kedarnath. Overnight Kedarnath." },
      { title: "Day 8", detail: "Kedarnath darshan, descend to Sonprayag, drive to Guptkashi. Overnight." },
      { title: "Day 9", detail: "Drive to Badrinath via Joshimath. Evening aarti. Overnight Badrinath." },
      { title: "Day 10", detail: "Badrinath darshan, Mana village, drive to Rudraprayag/Srinagar. Overnight." },
      { title: "Day 11", detail: "Drive to Haridwar. Tour ends." },
    ],
    inclusions: [
      "10 nights' hotel accommodation on twin sharing",
      "All transfers by private vehicle from Haridwar",
      "Daily breakfast and dinner",
      "Driver allowance, tolls, parking and fuel",
      "Assistance for darshan and permits where applicable",
    ],
    exclusions: [
      "Kedarnath pony, palki or helicopter",
      "Lunches and personal expenses",
      "Any airfare or train fare to Haridwar",
      "VIP darshan, pujas and donations",
    ],
    accommodationNote:
      "Standard hotels and guesthouses on the route; category rises the price. Kedarnath night is basic.",
    transportNote:
      "Private vehicle sized to the group, from and back to Haridwar. Shared coach option is cheaper — ask.",
    mealsNote: "Breakfast and dinner daily, vegetarian, at the hotels. Lunch is on your own on the road.",
    terms: [
      "Itinerary and night halts can change with weather, road blocks and shrine timings.",
      "50% advance to confirm; balance before departure.",
      "The high-altitude legs need basic fitness and a medical check for Kedarnath.",
    ],
    faqs: [
      {
        q: "Is the Kedarnath trek included?",
        a: "The transport to Sonprayag is included. The 16 km trek itself is on foot; pony, palki and helicopter are all available at extra cost and we can pre-book them.",
      },
      {
        q: "Can you do this by helicopter instead?",
        a: "Yes — a separate Do Dham or Char Dham by helicopter package. Tell us and we'll quote it.",
      },
    ],
    sortOrder: 2,
    isPublished: true,
  },
  {
    slug: "do-dham-yatra",
    name: "Do Dham Yatra",
    category: "Pilgrimage",
    destinationSlug: "haridwar",
    durationLabel: "5 nights / 6 days",
    nights: 5,
    routeLabel: "Kedarnath · Badrinath",
    priceInr: 25000,
    compareAtPriceInr: null,
    priceNote: "per person, twin sharing",
    rating: null,
    reviewCount: null,
    badge: null,
    summary:
      "The two most-visited shrines — Kedarnath and Badrinath — from Haridwar in six days, with hotels, private transport and darshan assistance.",
    description:
      "A shorter pilgrimage for travellers who cannot spare eleven days. Same standard of hotels and transport as the Char Dham package, covering the Kedarnath trek from Sonprayag and Badrinath by road via Joshimath.",
    itinerary: [
      { title: "Day 1", detail: "Arrive Haridwar, drive to Guptkashi. Overnight Guptkashi." },
      { title: "Day 2", detail: "Sonprayag, trek/pony 16 km to Kedarnath. Overnight Kedarnath." },
      { title: "Day 3", detail: "Kedarnath darshan, descend, drive towards Badrinath side. Overnight en route." },
      { title: "Day 4", detail: "Drive to Badrinath via Joshimath. Evening aarti. Overnight Badrinath." },
      { title: "Day 5", detail: "Badrinath darshan, Mana village, drive to Rudraprayag. Overnight." },
      { title: "Day 6", detail: "Drive to Haridwar. Tour ends." },
    ],
    inclusions: [
      "5 nights' hotel accommodation on twin sharing",
      "All transfers by private vehicle from Haridwar",
      "Daily breakfast and dinner",
      "Driver allowance, tolls, parking and fuel",
    ],
    exclusions: [
      "Kedarnath pony, palki or helicopter",
      "Lunches and personal expenses",
      "Travel to and from Haridwar",
    ],
    accommodationNote: "Standard hotels and guesthouses; Kedarnath night is basic.",
    transportNote: "Private vehicle from and back to Haridwar, sized to the group.",
    mealsNote: "Breakfast and dinner daily, vegetarian.",
    terms: [
      "Itinerary can change with weather and shrine timings.",
      "50% advance to confirm; balance before departure.",
    ],
    faqs: [],
    sortOrder: 3,
    isPublished: true,
  },
  {
    slug: "rishikesh-mussoorie-3n-4d",
    name: "Rishikesh + Mussoorie",
    category: "Multi-day tour",
    destinationSlug: "rishikesh",
    durationLabel: "3 nights / 4 days",
    nights: 3,
    routeLabel: "Rishikesh · Mussoorie",
    priceInr: 35000,
    compareAtPriceInr: null,
    priceNote: "per person, twin sharing, group of 4",
    rating: null,
    reviewCount: null,
    badge: "Popular short break",
    summary:
      "Two nights in Rishikesh with a rafting session, then a night in Mussoorie — hotels, private car and the main sights, in a long weekend.",
    description:
      "A compact Uttarakhand loop: arrive Rishikesh, raft the 16 km Shivpuri stretch, see the aarti and the jhula bridges, then drive up to Mussoorie for the Mall, Kempty Falls and the valley views before heading back to Dehradun.",
    itinerary: [
      { title: "Day 1", detail: "Arrive Rishikesh, check in, evening Ganga Aarti at Triveni Ghat. Overnight Rishikesh." },
      { title: "Day 2", detail: "16 km rafting from Shivpuri, afternoon at Laxman Jhula and the Tapovan cafés. Overnight Rishikesh." },
      { title: "Day 3", detail: "Drive to Mussoorie via Dehradun. Mall Road and Gun Hill in the evening. Overnight Mussoorie." },
      { title: "Day 4", detail: "Kempty Falls and Camel's Back Road, then drop to Dehradun airport/station. Tour ends." },
    ],
    inclusions: [
      "3 nights' hotel accommodation on twin sharing",
      "Private car for the full itinerary (Dehradun–Rishikesh–Mussoorie–Dehradun)",
      "Daily breakfast",
      "One 16 km rafting session with safety gear and guide",
      "All toll, parking and driver charges",
    ],
    exclusions: [
      "Lunch and dinner",
      "Airfare or train fare to Dehradun",
      "Entry tickets and personal expenses",
      "Anything not listed under inclusions",
    ],
    accommodationNote:
      "3-star hotels or riverside camps in Rishikesh and a Mall-Road-area hotel in Mussoorie. Upgrades on request.",
    transportNote: "One private car (sedan for up to 3, SUV for 4–6) for the whole trip, with driver.",
    mealsNote: "Breakfast daily at the hotels. Lunch and dinner are on your own.",
    terms: [
      "Price shown assumes a group of four sharing; solo and couple pricing differs.",
      "Rafting moves to a shorter stretch or a refund if the river is closed on your date.",
      "25% advance to confirm; balance on arrival.",
    ],
    faqs: [
      {
        q: "What if it rains and rafting is off?",
        a: "We switch you to the 12 km stretch if it's runnable, or refund the rafting portion and add a half-day in Rishikesh.",
      },
    ],
    sortOrder: 4,
    isPublished: true,
  },
  {
    slug: "shimla-manali-4n-5d",
    name: "Shimla + Manali",
    category: "Multi-day tour",
    destinationSlug: "shimla",
    durationLabel: "4 nights / 5 days",
    nights: 4,
    routeLabel: "Shimla · Manali",
    priceInr: 40000,
    compareAtPriceInr: null,
    priceNote: "per person, twin sharing, group of 4",
    rating: null,
    reviewCount: null,
    badge: null,
    summary:
      "The classic Himachal pairing — two nights in Shimla, two in Manali — with a private car, hotels and the Kufri and Solang day trips.",
    description:
      "Arrive Shimla, take the Ridge and a Kufri excursion, then drive the Beas valley to Manali for Solang, the Atal Tunnel and Old Manali.",
    itinerary: [
      { title: "Day 1", detail: "Arrive Shimla (from Chandigarh/Kalka), evening on the Ridge and Mall Road. Overnight Shimla." },
      { title: "Day 2", detail: "Kufri excursion and Jakhoo temple. Overnight Shimla." },
      { title: "Day 3", detail: "Drive to Manali via the Beas valley (about 8 hours). Overnight Manali." },
      { title: "Day 4", detail: "Solang Valley and Atal Tunnel / Sissu, evening in Old Manali. Overnight Manali." },
      { title: "Day 5", detail: "Hadimba temple and the Mall, then drop to Bhuntar airport or the Volvo stand. Tour ends." },
    ],
    inclusions: [
      "4 nights' hotel accommodation on twin sharing",
      "Private car for the full itinerary from Chandigarh/Kalka",
      "Daily breakfast",
      "All toll, parking and driver charges",
    ],
    exclusions: [
      "Lunch and dinner",
      "Travel to Chandigarh/Kalka and from Bhuntar",
      "Solang activity tickets, ropeways and permits (Atal Tunnel/Rohtang)",
      "Personal expenses",
    ],
    accommodationNote: "3-star hotels in Shimla (Mall area) and Manali. Upgrades and Old Manali stays on request.",
    transportNote: "One private car (sedan for up to 3, SUV for 4–6) for the whole trip, with driver.",
    mealsNote: "Breakfast daily. Lunch and dinner are on your own.",
    terms: [
      "Price shown assumes a group of four sharing.",
      "Rohtang Pass needs a separate permit and is weather-dependent; Atal Tunnel/Sissu is the usual alternative.",
      "25% advance to confirm; balance on arrival.",
    ],
    faqs: [
      {
        q: "Can we go up to Rohtang Pass?",
        a: "Rohtang needs a separate permit and is weather-dependent. If it is closed we run the Atal Tunnel and Sissu instead, which is included.",
      },
    ],
    sortOrder: 5,
    isPublished: true,
  },
];

/**
 * Car and bike rental. Car is quote-only; bike is a flat ₹600/day per the
 * blueprint. Deposit and terms are placeholders for the client to confirm.
 */
export const RENTALS: RentalInsert[] = [
  {
    kind: "car",
    slug: "car-rental",
    name: "Car rental with driver",
    perDayInr: null,
    quoteOnly: true,
    depositInr: null,
    seats: 6,
    transmission: "Sedan · SUV · Tempo Traveller",
    fuelNote: "Fuel and driver allowance built into the quote",
    summary:
      "Sedans, SUVs and tempo travellers with a driver, for airport transfers, day trips and full multi-day itineraries. Priced per route — send your plan and dates and we'll quote.",
    description:
      "We don't run a fixed per-day car rate because the cost of a Rishikesh airport drop and a ten-day Char Dham circuit are nothing alike. Give us the pickup point, the rough itinerary and the group size and we'll come back with a fixed quote that includes fuel, tolls, parking and the driver's allowance. Self-drive cars are not offered.",
    includes: [
      "Driver, fuel, tolls, parking and state permits",
      "Vehicle sized to your group",
      "24×7 contact number for the trip",
    ],
    documentsRequired: ["A valid photo ID for the lead traveller"],
    terms: [
      "Quote is fixed for the itinerary agreed; detours are charged on actuals.",
      "Hill driving hours are capped for safety — long legs are planned with a night halt.",
      "25% advance confirms the vehicle for your dates.",
    ],
    pickupNote: "Pickup from Dehradun airport, Haridwar/Rishikesh railway stations, or your hotel.",
    faqs: [
      {
        q: "Do you have self-drive cars?",
        a: "No. All our cars come with a driver who knows the hill roads — it is safer and usually works out cheaper once fuel and permits are counted.",
      },
      {
        q: "How fast do I get a quote?",
        a: "Usually within a couple of hours on WhatsApp once we have your itinerary and dates.",
      },
    ],
    sortOrder: 1,
    isPublished: true,
  },
  {
    kind: "bike",
    slug: "bike-rental",
    name: "Bike rental",
    perDayInr: 600,
    quoteOnly: false,
    depositInr: 3000,
    seats: null,
    transmission: "Geared bikes and scooters",
    fuelNote: "Fuel not included — return with the same level",
    summary:
      "Geared bikes and scooters for getting around Rishikesh and the nearby hills. ₹600 a day, one helmet included, refundable deposit.",
    description:
      "A small fleet of well-maintained bikes and scooters, hired by the day from our Tapovan office. Rate is ₹600 per 24 hours; a refundable security deposit and your original licence are held for the rental period. Fuel is on you. We give you a second helmet and a basic tool kit on request.",
    includes: ["One helmet", "Basic tool kit on request", "24×7 roadside contact number"],
    documentsRequired: [
      "Original driving licence valid for two-wheelers",
      "Aadhaar card or passport",
      "Refundable security deposit (cash or UPI)",
    ],
    terms: [
      "Rate is per 24 hours from pickup time; a grace of one hour, then a half-day charge.",
      "Fuel is not included — return with the fuel level you took it at.",
      "Traffic challans and any damage are billed to the renter from the deposit.",
      "The bike stays within Uttarakhand unless agreed in writing.",
    ],
    pickupNote: "Pick up and drop at our Tapovan office, 9am to 7pm.",
    faqs: [
      {
        q: "Can I take the bike to Rishikesh's rafting points and back?",
        a: "Yes, day trips around Rishikesh, Shivpuri and Neelkanth are fine. For longer hill routes tell us first so we give you the right bike.",
      },
      {
        q: "Is an international licence accepted?",
        a: "An International Driving Permit alongside your home-country licence is accepted. A tourist visa copy is also needed.",
      },
    ],
    sortOrder: 2,
    isPublished: true,
  },
];
