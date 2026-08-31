import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { BungeeCard } from "@/components/site/bungee-card";
import { resolveClosure } from "@/lib/closure";
import { slugify } from "@/lib/format";
import type { Adventure, Closure } from "@/lib/content";

/** Bungee jumps that have no operator set fall under this heading. */
const UNBRANDED = "Other operators";

function groupByBrand(items: Adventure[]): { brand: string; items: Adventure[] }[] {
  const map = new Map<string, Adventure[]>();
  for (const a of items) {
    const key = a.brand?.trim() || UNBRANDED;
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(a);
  }
  // Keep first-seen order (already sorted by sortOrder upstream).
  return [...map.entries()].map(([brand, items]) => ({ brand, items }));
}

/**
 * Bungee jumping shown the way the reference does it — a section per operator
 * (Himalayan Bungee, Jumpin Heights, Maa Ganga Bungee…), each a horizontally
 * scrolling row of that operator's jumps with a "See all" link.
 */
export function BungeeBrands({
  bungee,
  closures,
  whatsappNumber,
}: {
  bungee: Adventure[];
  closures: Closure[];
  whatsappNumber: string;
}) {
  if (bungee.length === 0) return null;
  const groups = groupByBrand(bungee);

  return (
    <div className="space-y-14">
      {groups.map(({ brand, items }) => (
        <div key={brand}>
          <div className="flex items-end justify-between gap-4">
            <h3 className="text-title text-ink">{brand}</h3>
            {brand !== UNBRANDED && (
              <Link
                href={`/adventures?brand=${slugify(brand)}`}
                className="inline-flex shrink-0 items-center gap-1.5 text-small font-semibold text-link no-underline hover:underline"
              >
                See all <ArrowRight className="size-4" aria-hidden />
              </Link>
            )}
          </div>

          {items.length === 1 ? (
            <div className="mt-5 max-w-3xl">
              <BungeeCard
                adventure={items[0]}
                closure={resolveClosure(closures, {
                  service: "bungee",
                  entityType: "adventure",
                  entityId: items[0].id,
                })}
                whatsappNumber={whatsappNumber}
              />
            </div>
          ) : (
            <div className="-mx-4 mt-5 flex snap-x gap-5 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0">
              {items.map((a) => (
                <div
                  key={a.id}
                  className="w-[min(88vw,40rem)] shrink-0 snap-start last:pr-4 sm:last:pr-0"
                >
                  <BungeeCard
                    adventure={a}
                    closure={resolveClosure(closures, {
                      service: "bungee",
                      entityType: "adventure",
                      entityId: a.id,
                    })}
                    whatsappNumber={whatsappNumber}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
