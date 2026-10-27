import Link from "next/link";
import { ArrowRight, Car, Mountain, Waves, Wind, type LucideIcon } from "lucide-react";
import { Card, Chip, MediaFrame, SectionHeading, type MediaSource } from "@/components/ui";
import { CardLink } from "@/components/site/product-card";
import { resolveClosure } from "@/lib/closure";
import { formatINR } from "@/lib/format";
import type { Adventure, Closure, EnquiryKind, Rental } from "@/lib/content";

type RateItem = {
  key: string;
  name: string;
  href: string;
  media: MediaSource | null;
  /** Null renders "On request" — a quote-only rental. */
  priceInr: number | null;
  unit: string;
  closure: Closure | null;
};

type RateGroup = {
  title: string;
  icon: LucideIcon;
  href: string;
  items: RateItem[];
};

/** Drone-craft runs are the same stretches in another boat; the card lists each stretch once. */
const isDroneCraft = (slug: string) => slug.includes("drone-craft");

function adventureItems(
  list: Adventure[],
  service: EnquiryKind,
  basePath: string,
  closures: Closure[],
): RateItem[] {
  return list.map((a) => ({
    key: `${a.kind}-${a.id}`,
    name: a.name,
    href: `${basePath}/${a.slug}`,
    media: a.coverMedia ?? null,
    priceInr: a.priceInr,
    unit: "per person",
    closure: resolveClosure(closures, { service, entityType: "adventure", entityId: a.id }),
  }));
}

/**
 * The owner's rate-card poster as a section: every rental and adventure in four
 * rows, name and price only, each card through to its detail page. It reads the
 * same rows as the sections further down, so a price changed in admin changes
 * here too.
 */
export function RateCard({
  rentals,
  rafting,
  bungee,
  activities,
  closures,
}: {
  rentals: Rental[];
  rafting: Adventure[];
  bungee: Adventure[];
  activities: Adventure[];
  closures: Closure[];
}) {
  const rentalClosure = resolveClosure(closures, { service: "rental" });
  const groups: RateGroup[] = [
    {
      title: "Vehicle rentals",
      icon: Car,
      href: "/rentals",
      items: rentals.map((r) => ({
        key: `rental-${r.id}`,
        name: r.name,
        href: `/rentals/${r.slug}`,
        media: r.coverMedia ?? null,
        priceInr: r.quoteOnly ? null : r.perDayInr,
        unit: "per day",
        closure: rentalClosure,
      })),
    },
    {
      title: "River rafting",
      icon: Waves,
      href: "/rafting",
      items: adventureItems(
        rafting.filter((a) => !isDroneCraft(a.slug)),
        "rafting",
        "/rafting",
        closures,
      ),
    },
    {
      title: "Bungee jumping",
      icon: Mountain,
      href: "/adventures",
      items: adventureItems(bungee, "bungee", "/bungee", closures),
    },
    {
      title: "Paragliding & zip line",
      icon: Wind,
      href: "/adventures",
      items: adventureItems(activities, "activity", "/adventures", closures),
    },
  ].filter((g) => g.items.length > 0);

  if (groups.length === 0) return null;

  return (
    <section id="rates" className="container-page scroll-mt-28 pt-16 lg:pt-20">
      <SectionHeading
        as="h2"
        title="Adventure activities & rentals"
        description="Everything we book from Tapovan, with its price. Tap a card for the details and to book."
      />

      <div className="mt-10 space-y-12">
        {groups.map((g) => (
          <div key={g.title}>
            <div className="flex items-center justify-between gap-3">
              <h3 className="flex items-center gap-3 text-title text-ink">
                <span className="grid size-10 shrink-0 place-items-center rounded-full bg-jade-900 text-ember-300">
                  <g.icon className="size-5" aria-hidden />
                </span>
                {g.title}
              </h3>
              <Link
                href={g.href}
                className="inline-flex h-11 shrink-0 items-center gap-1.5 text-small font-semibold text-link no-underline hover:underline"
              >
                See all <ArrowRight className="size-4" aria-hidden />
              </Link>
            </div>

            <ul className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-5">
              {g.items.map((item) => (
                <li key={item.key} className="min-w-0">
                  <Card elevation="raised" interactive className="h-full">
                    <CardLink
                      closure={item.closure}
                      href={item.href}
                      className="flex h-full flex-col no-underline"
                    >
                      <MediaFrame
                        media={item.media}
                        sizes="(min-width: 1024px) 15rem, (min-width: 640px) 33vw, 50vw"
                        standInSeed={item.key}
                        scrim={item.closure !== null}
                        emptyLabel={`${item.name} — photograph pending`}
                      >
                        {item.closure && (
                          <div className="absolute inset-x-0 top-0 flex justify-end p-2">
                            <Chip tone="closed" size="sm">
                              Closed
                            </Chip>
                          </div>
                        )}
                      </MediaFrame>
                      <div className="flex flex-1 flex-col p-3 sm:p-4">
                        <h4 className="line-clamp-2 text-small font-semibold text-ink">
                          {item.name}
                        </h4>
                        <p className="mt-auto pt-3">
                          {item.priceInr === null ? (
                            <span className="text-subtitle text-ink">On request</span>
                          ) : (
                            <>
                              <span className="tabular text-title text-ink">
                                {formatINR(item.priceInr)}
                              </span>{" "}
                              <span className="text-caption text-ink-faint">{item.unit}</span>
                            </>
                          )}
                        </p>
                      </div>
                    </CardLink>
                  </Card>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
