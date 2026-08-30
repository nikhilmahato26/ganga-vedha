import { config } from "dotenv";

config({ path: ".env.local", quiet: true });
config({ path: ".env", quiet: true });
import { eq, sql } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { getDb } from "@/db";
import {
  adminUsers,
  adventures,
  closures,
  contentBlocks,
  destinations,
  hotelRooms,
  hotels,
  packages,
  rentals,
  reviews,
  serviceLines,
  siteSettings,
} from "@/db/schema";
import {
  ADVENTURES,
  DESTINATIONS,
  HOTELS,
  PACKAGES,
  RENTALS,
  REVIEWS,
  SETTINGS,
} from "./data";

const CONTENT_BLOCKS = [
  {
    key: "why-choose-us",
    title: "Why book with us",
    subtitle: "Four things we do differently, all of which you can check before you pay us anything.",
    isActive: true,
    sortOrder: 1,
    items: [
      {
        icon: "route",
        title: "Sold by distance, not by package name",
        body: "Every stretch has its kilometres, its put-in point, its grade and its price on the card. You are choosing a stretch of river, not a marketing tier.",
      },
      {
        icon: "radio",
        title: "We tell you when the river is shut",
        body: "The Ganga closes through the monsoon. Our booking button closes with it, and the strap at the top of this page says so every day of the year.",
      },
      {
        icon: "life-buoy",
        title: "Limits stated before you book",
        body: "Minimum age, minimum and maximum weight, and what the grade actually means. Nobody arrives at the put-in to be turned away.",
      },
      {
        icon: "sparkles",
        title: "One number, one person",
        body: "Your enquiry goes to a real WhatsApp thread with the people running the raft, not a call centre. Your details are saved either way.",
      },
    ],
  },
];

/**
 * Seeded inactive. The client turns rafting off from the admin dashboard when
 * the monsoon actually arrives — a seed script should never ship a live site
 * in a closed state.
 */
const SEED_CLOSURE = {
  scope: "service" as const,
  serviceKey: "rafting" as const,
  entityType: null,
  entityId: null,
  isActive: false,
  icon: "rain" as const,
  title: "Rafting paused from mid-September",
  body: "Due to monsoon rains and high water levels on the Ganga, river rafting in Rishikesh is temporarily stopped for safety.",
  footnote: "Bookings reopen after the rains ease",
  ctaLabel: "Got it",
  version: 1,
};

/**
 * Idempotent by design: every insert conflicts on a natural key (slug, email,
 * the settings singleton, the service `key`) and updates in place. Re-running
 * `npm run db:seed` after a content edit in this file is always safe — it
 * never duplicates rows, and it never touches a table this file does not list.
 */
async function main() {
  const db = getDb();

  const email = process.env.SEED_ADMIN_EMAIL;
  const password = process.env.SEED_ADMIN_PASSWORD;
  if (!email || !password) {
    throw new Error(
      "SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD must be set in .env.local before seeding.",
    );
  }
  if (password.length < 12) {
    throw new Error("SEED_ADMIN_PASSWORD must be at least 12 characters.");
  }

  console.log("→ site settings");
  await db
    .insert(siteSettings)
    .values({ id: 1, ...SETTINGS })
    .onConflictDoUpdate({ target: siteSettings.id, set: SETTINGS });

  console.log("→ service lines");
  for (const s of [
    { key: "hotel" as const, label: "Hotel booking", href: "/hotels", sortOrder: 1 },
    { key: "rafting" as const, label: "River rafting", href: "/rafting", sortOrder: 2 },
    {
      key: "bungee" as const,
      label: "Bungee jumping",
      href: "/bungee/bungee-jump-rishikesh",
      sortOrder: 3,
    },
  ]) {
    await db
      .insert(serviceLines)
      .values(s)
      .onConflictDoUpdate({ target: serviceLines.key, set: s });
  }

  console.log(`→ adventures (${ADVENTURES.length})`);
  for (const a of ADVENTURES) {
    await db
      .insert(adventures)
      .values(a)
      .onConflictDoUpdate({ target: adventures.slug, set: a });
  }

  console.log(`→ destinations (${DESTINATIONS.length})`);
  for (const d of DESTINATIONS) {
    await db
      .insert(destinations)
      .values(d)
      .onConflictDoUpdate({ target: destinations.slug, set: d });
  }

  // slug → id, so hotels and packages can carry a readable destinationSlug in
  // the seed file and still land a real FK.
  const destRows = await db
    .select({ id: destinations.id, slug: destinations.slug })
    .from(destinations);
  const destIdBySlug = new Map(destRows.map((r) => [r.slug, r.id]));

  console.log(`→ packages (${PACKAGES.length})`);
  for (const { destinationSlug, ...p } of PACKAGES) {
    const values = {
      ...p,
      destinationId: destinationSlug ? (destIdBySlug.get(destinationSlug) ?? null) : null,
    };
    await db
      .insert(packages)
      .values(values)
      .onConflictDoUpdate({ target: packages.slug, set: values });
  }

  console.log(`→ rentals (${RENTALS.length})`);
  for (const r of RENTALS) {
    await db
      .insert(rentals)
      .values(r)
      .onConflictDoUpdate({ target: rentals.slug, set: r });
  }

  console.log(`→ hotels + rooms (${HOTELS.length})`);
  for (const { rooms, destinationSlug, ...h } of HOTELS) {
    const values = {
      ...h,
      destinationId: destinationSlug ? (destIdBySlug.get(destinationSlug) ?? null) : null,
    };
    const [row] = await db
      .insert(hotels)
      .values(values)
      .onConflictDoUpdate({ target: hotels.slug, set: values })
      .returning({ id: hotels.id });

    // Rooms have no natural key of their own — replace the set for this
    // hotel each run rather than guessing which existing row is which.
    await db.delete(hotelRooms).where(eq(hotelRooms.hotelId, row.id));
    if (rooms.length) {
      await db.insert(hotelRooms).values(rooms.map((r) => ({ ...r, hotelId: row.id })));
    }
  }

  console.log(`→ reviews (${REVIEWS.length})`);
  await db.delete(reviews);
  if (REVIEWS.length) await db.insert(reviews).values(REVIEWS);

  console.log("→ content blocks");
  for (const c of CONTENT_BLOCKS) {
    await db
      .insert(contentBlocks)
      .values(c)
      .onConflictDoUpdate({ target: contentBlocks.key, set: c });
  }

  console.log("→ closures (seeded inactive — flip from the admin dashboard)");
  const existingClosure = await db
    .select({ id: closures.id })
    .from(closures)
    .where(eq(closures.serviceKey, "rafting"));
  if (!existingClosure.length) await db.insert(closures).values(SEED_CLOSURE);

  console.log("→ owner account");
  const passwordHash = await bcrypt.hash(password, 12);
  // admin_users has no plain unique constraint on `email` — its uniqueness is
  // a case-insensitive functional index on lower(email), which Postgres
  // cannot use as an ON CONFLICT target. Select-then-write instead.
  const existingAdmin = await db
    .select({ id: adminUsers.id })
    .from(adminUsers)
    .where(sql`lower(${adminUsers.email}) = lower(${email})`);
  if (existingAdmin.length) {
    await db
      .update(adminUsers)
      .set({ passwordHash, updatedAt: new Date() })
      .where(eq(adminUsers.id, existingAdmin[0].id));
  } else {
    await db.insert(adminUsers).values({ email, passwordHash, name: "Owner" });
  }

  console.log("\n✓ Seed complete.");
  console.log(`  Admin login: ${email}`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("\n✗ Seed failed:", err.message);
    process.exit(1);
  });
