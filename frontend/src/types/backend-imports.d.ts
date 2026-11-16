/**
 * Lets `tsc` here follow type-only imports into backend/src (lib/admin-data.ts, lib/db-types.ts)
 * without the Workers type library, which clashes with the DOM types. Never used at runtime.
 */
declare module "cloudflare:workers" {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export const env: Record<string, any>;
  export function waitUntil(promise: Promise<unknown>): void;
}
