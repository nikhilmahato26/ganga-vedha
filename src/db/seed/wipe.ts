import { config } from "dotenv";

config({ path: ".env.local", quiet: true });
config({ path: ".env", quiet: true });

import { neon } from "@neondatabase/serverless";

/**
 * Empties every table so `npm run db:seed` starts from a genuinely blank
 * database — the rehearsal for "something went badly wrong, start over"
 * without needing to touch the schema or credentials at all.
 *
 * Requires `--yes` on the command line. This is destructive and irreversible
 * outside of Neon's own point-in-time restore; there is no soft mode.
 */
async function main() {
  if (!process.argv.includes("--yes")) {
    console.error(
      "Refusing to wipe without --yes.\n" +
        "This empties every table in the database this project's DATABASE_URL points at.\n" +
        "Run: npm run db:wipe -- --yes",
    );
    process.exit(1);
  }

  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set.");
  const sql = neon(url);

  console.log(`→ wiping database at ${new URL(url).hostname}`);

  // CASCADE handles FK order for us — no need to sequence 13 tables by hand,
  // and it is what makes this safe to run again after the schema grows.
  await sql`
    truncate table
      admin_users, adventures, audit_log, closures, content_blocks,
      destinations, enquiries, gallery_items, hotel_rooms, hotels,
      media, media_links, packages, promotions, rentals,
      reviews, service_lines, site_settings
    restart identity cascade
  `;

  console.log("✓ Wiped. Run `npm run db:seed` to repopulate.");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("\n✗ Wipe failed:", err.message);
    process.exit(1);
  });
