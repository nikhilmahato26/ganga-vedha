import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Clock, MapPin, Mountain, Users } from "lucide-react";
import {
  Accordion,
  Alert,
  AvailabilityPill,
  Breadcrumb,
  Chip,
  GradeChip,
  MediaFrame,
  Rating,
  SectionHeading,
  Tabs,
} from "@/components/ui";
import { EnquireButton } from "@/components/site/enquiry";
import { BookingPanel, IncludedList, SpecGrid } from "@/components/site/detail";
import { AdventureCard } from "@/components/site/product-card";
import { ClosureTrigger } from "@/components/site/chrome";
import {
  getAdventure,
  getAdventures,
  getClosures,
  getSiteSettings,
} from "@/lib/content";
import { isBookable, resolveClosure } from "@/lib/closure";
import { formatDuration, formatINR } from "@/lib/format";

// 60s: matches the adventures cache window in @/lib/content.
export const revalidate = 60;

export async function generateStaticParams() {
  const list = await getAdventures("bungee");
  return list.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const a = await getAdventure(slug);
  if (!a) return { title: "Not found" };
  return {
    title: a.name,
    description: a.summary,
    alternates: { canonical: `/bungee/${a.slug}` },
    openGraph: { title: `${a.name} · Ganga Vedha`, description: a.summary },
  };
}

export default async function BungeeDetail({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [adventure, settings, closures, all] = await Promise.all([
    getAdventure(slug),
    getSiteSettings(),
    getClosures(),
    getAdventures("bungee"),
  ]);
  if (!adventure || adventure.kind !== "bungee") notFound();

  const open = isBookable(closures, {
    service: "bungee",
    entityType: "adventure",
    entityId: adventure.id,
  });
  const closure = resolveClosure(closures, {
    service: "bungee",
    entityType: "adventure",
    entityId: adventure.id,
  });
  const related = all.filter((a) => a.id !== adventure.id).slice(0, 3);

  const product = {
    kind: "rafting" as const,
    slug: adventure.slug,
    name: adventure.name,
    priceInr: adventure.priceInr,
    priceUnit: "per person",
  };

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: adventure.name,
    description: adventure.summary,
    brand: { "@type": "Brand", name: settings.brandName },
    offers: {
      "@type": "Offer",
      price: adventure.priceInr,
      priceCurrency: "INR",
      availability: open
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="container-page pt-6">
        <Breadcrumb
          items={[
            { label: "Home", href: "/" },
            { label: "Bungee", href: "/bungee/bungee-jump-rishikesh" },
            { label: adventure.name },
          ]}
        />
      </div>

      <div className="container-page pt-6">
        {(() => {
          const hero = (
            <MediaFrame
              media={adventure.coverMedia ?? null}
              ratio="wide"
              standInSeed={adventure.slug}
              priority
              className="rounded-xl"
              emptyLabel={`${adventure.name} — photograph pending`}
            >
              <div className="absolute inset-x-0 top-0 flex flex-wrap items-start gap-2 p-4">
                {adventure.grade && <GradeChip grade={adventure.grade} onMedia />}
                <Chip tone="onMedia" icon={<Mountain />}>{adventure.heightM} m</Chip>
                <Chip tone="onMedia" icon={<Clock />}>
                  {formatDuration(adventure.durationMinutes)}
                </Chip>
              </div>
              {!open && (
                <>
                  <div className="absolute inset-0 bg-granite-950/55" aria-hidden />
                  <div className="absolute inset-0 grid place-items-center px-4">
                    <AvailabilityPill open={false} label="Tap to see why" onMedia />
                  </div>
                </>
              )}
            </MediaFrame>
          );
          return !open && closure ? (
            <ClosureTrigger closure={closure} className="block w-full rounded-xl text-left">
              {hero}
            </ClosureTrigger>
          ) : (
            hero
          );
        })()}
      </div>

      <div className="container-page grid gap-12 pt-10 lg:grid-cols-[1fr_22rem]">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-display-lg text-ink">{adventure.name}</h1>
            {adventure.badge && <Chip tone="ember">{adventure.badge}</Chip>}
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-small text-ink-muted">
            {adventure.rating !== null && (
              <Rating value={adventure.rating} count={adventure.reviewCount} />
            )}
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="size-4" aria-hidden /> At {adventure.putInPoint}
            </span>
          </div>

          {closure && (
            <Alert tone="closed" title={closure.title} className="mt-6">
              {closure.body}
              {closure.footnote ? ` ${closure.footnote}.` : ""}
            </Alert>
          )}
          <SpecGrid
            className="mt-8"
            items={[
              { label: "Height", value: `${adventure.heightM} m` },
              { label: "Duration", value: formatDuration(adventure.durationMinutes) },
              { label: "Minimum age", value: `${adventure.minAge} years` },
              {
                label: "Weight",
                value: `${adventure.minWeightKg}–${adventure.maxWeightKg} kg`,
              },
            ]}
          />

          <div className="mt-10">
            <Tabs
              tabs={[
                {
                  id: "about",
                  label: "About the jump",
                  content: (
                    <div className="space-y-6">
                      <p className="measure text-ink-muted">{adventure.description}</p>
                                          </div>
                  ),
                },
                {
                  id: "included",
                  label: "What's included",
                  content: (
                    <IncludedList
                      inclusions={adventure.inclusions}
                      exclusions={adventure.exclusions}
                    />
                  ),
                },
                {
                  id: "bring",
                  label: "What to bring",
                  content: (
                    <ul className="measure space-y-2.5">
                      {adventure.whatToBring.map((i) => (
                        <li key={i} className="flex items-start gap-2.5 text-small text-ink-muted">
                          <Users className="mt-0.5 size-4 shrink-0 text-ink-faint" aria-hidden />
                          {i}
                        </li>
                      ))}
                    </ul>
                  ),
                },
                {
                  id: "meet",
                  label: "Meeting point",
                  content: <p className="measure text-ink-muted">{adventure.meetingPoint}</p>,
                },
              ]}
            />
          </div>

          <div className="mt-14">
            <SectionHeading as="h2" title="Questions people ask" />
            <Accordion className="mt-6" items={adventure.faqs} />
          </div>
        </div>

        <aside className="lg:min-w-0">
          <BookingPanel>
            <p className="tabular text-display-md leading-none text-ink">
              {formatINR(adventure.priceInr)}
            </p>
            <p className="mt-1.5 text-small text-ink-faint">
              {adventure.compareAtPriceInr && (
                <s className="tabular mr-1.5">{formatINR(adventure.compareAtPriceInr)}</s>
              )}
              per person
            </p>

            <div className="mt-6 space-y-3 border-t border-hairline pt-6 text-small text-ink-muted">
              {[
                ["Height", `${adventure.heightM} m`],
                ["Duration", formatDuration(adventure.durationMinutes)],
                ["Grade", adventure.grade ?? "—"],
                ["Location", adventure.putInPoint ?? "—"],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-4">
                  <span>{k}</span>
                  <span className="tabular font-semibold text-ink capitalize">{v}</span>
                </div>
              ))}
            </div>

            <div className="mt-6">
              {open ? (
                <EnquireButton
                  block
                  size="lg"
                  source="detail"
                  product={product}
                  whatsappNumber={settings.whatsappNumber}
                />
              ) : (
                closure && (
                  <ClosureTrigger closure={closure}>Bookings closed — tap to see why</ClosureTrigger>
                )
              )}
            </div>
            <p className="mt-3 text-center text-caption text-ink-faint">
              Nothing is charged now — we confirm on WhatsApp first.
            </p>
          </BookingPanel>
        </aside>
      </div>

      {related.length > 0 && (
        <section className="container-page pt-24">
          <SectionHeading as="h2" title="Other adventures" />
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((a) => (
              <AdventureCard
                key={a.id}
                adventure={a}
                closure={resolveClosure(closures, {
                  service: "bungee",
                  entityType: "adventure",
                  entityId: a.id,
                })}
                whatsappNumber={settings.whatsappNumber}
              />
            ))}
          </div>
        </section>
      )}

      {/* Mobile booking bar. The desktop panel is sticky instead. */}
      {open && (
        <div className="sticky-action-bar fixed inset-x-0 bottom-0 z-(--z-sticky) border-t border-hairline bg-canvas/95 px-4 pt-3 pb-safe backdrop-blur-sm lg:hidden">
          <div className="flex items-center gap-3">
            <div className="min-w-0 flex-1">
              <p className="tabular text-title leading-none text-ink">
                {formatINR(adventure.priceInr)}
              </p>
              <p className="mt-1 text-caption text-ink-faint">per person</p>
            </div>
            <EnquireButton
              size="lg"
              source="detail"
              product={product}
              whatsappNumber={settings.whatsappNumber}
            />
          </div>
        </div>
      )}
      <div className="h-24 lg:hidden" aria-hidden />
    </>
  );
}
