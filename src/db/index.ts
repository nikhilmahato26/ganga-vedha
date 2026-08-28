import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { databaseUrl, assertPooledConnection } from "@/lib/env";
import * as schema from "./schema";

/**
 * One HTTP client per module instance. The neon-http driver issues a fetch per
 * query rather than holding a socket, which is what makes it safe in a
 * serverless function — there is no pool to exhaust and nothing to close.
 *
 * The client is created lazily so importing anything from `@/db` does not throw
 * before DATABASE_URL exists.
 */
let cached: ReturnType<typeof create> | null = null;

function create() {
  const url = databaseUrl();
  assertPooledConnection(url);
  return drizzle(neon(url), { schema, casing: "snake_case" });
}

export function getDb() {
  if (!cached) cached = create();
  return cached;
}

export { schema };
export * from "./schema";
