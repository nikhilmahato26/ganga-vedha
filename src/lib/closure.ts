import type { Closure, ServiceKey } from "./content";

export type ClosureTarget =
  | { service: ServiceKey }
  | { service: ServiceKey; entityType: "adventure" | "hotel"; entityId: number };

/**
 * Resolve whether a thing can be booked, most specific scope winning:
 *
 *     global  >  service  >  entity
 *
 * This is the ONLY place that answer is computed. There is deliberately no
 * `is_bookable` column on adventures or hotels — two places to say "closed" is
 * two places to forget, and the one that gets forgotten takes an enquiry for a
 * trip that cannot run.
 *
 * Scoping is why closing rafting for the monsoon does not also close hotels.
 */
export function resolveClosure(
  closures: Closure[],
  target: ClosureTarget,
): Closure | null {
  const active = closures.filter((c) => c.isActive);

  const entity =
    "entityId" in target
      ? active.find(
          (c) =>
            c.scope === "entity" &&
            c.entityType === target.entityType &&
            c.entityId === target.entityId,
        )
      : undefined;
  if (entity) return entity;

  const service = active.find(
    (c) => c.scope === "service" && c.serviceKey === target.service,
  );
  if (service) return service;

  return active.find((c) => c.scope === "global") ?? null;
}

export function isBookable(closures: Closure[], target: ClosureTarget): boolean {
  return resolveClosure(closures, target) === null;
}
