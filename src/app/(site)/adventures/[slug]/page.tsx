import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Clock, MapPin, Scale, Users } from "lucide-react";
import {
  Accordion,
  Alert,
  AvailabilityPill,
  Breadcrumb,
  Chip,
  GradeChip,
  MediaFrame,
  SectionHeading,
  Tabs,
} from "@/components/ui";
import { EnquireButton } from "@/components/site/enquiry";
import { BookingPanel, IncludedList, SpecGrid } from "@/components/site/detail";
import { AdventureCard } from "@/components/site/product-card";
import { ClosureTrigger } from "@/components/site/chrome";
import {
  getActivities,
  getAdventure,
  getClosures,
  getSiteSettings,
} from "@/lib/content";
import { isBookable, resolveClosure } from "@/lib/closure";
import { formatDuration, formatINR } from "@/lib/format";

// 60s: matches the adventures cache window in @/lib/content.
export const revalidate = 60;

const ACTIVITY_KINDS = ["paragliding", "zipline"] as const;

export async function generateStaticParams() {
  const list = await getActivities();
  return list.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const a = await getAdventure(slug);
  if (!a || !ACTIVITY_KINDS.includes(a.kind as (typeof ACTIVITY_KINDS)[number])) {
    return { title: "Not found" };
  }
  return {
    title: a.name,
    description: a.summary,
    alternates: { canonical: `/adventures/${a.slug}` },
    openGraph: { title: `${a.name} · Ganga Vedha`, description: a.summary },
  };
}

export default async function ActivityDetail({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [adventure, settings, closures, all] = await Promise.all([
    getAdventure(slug),
    getSiteSettings(),
    getClosures(),
    getActivities(),
  ]);
  if (
    !adventure ||
    !ACTIVITY_KINDS.includes(adventure.kind as (typeof ACTIVITY_KINDS)[number])
  ) {
    notFound();
  }

  const target = {
    service: "activity" as const,
    entityType: "adventure" as const,
    entityId: adventure.id,
  };
  const open = isBookable(closures, target);
  const closure = resolveClosure(closures, target);
  const related = all.filter((a) => a.id !== adventure.id).slice(0, 3);

  const product = {
    kind: adventure.kind,
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
            { label: "Adventures", href: "/adventures" },
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
                <Chip tone="onMedia" icon={<Clock />}>
                  {formatDuration(adventure.durationMinutes)}
                </Chip>
                {adventure.putInPoint && (
                  <Chip tone="onMedia" icon={<MapPin />}>
                    {adventure.putInPoint}
                  </Chip>
                )}
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
          <p className="mt-3 measure text-subtitle font-normal text-ink-muted">
            {adventure.summary}
          </p>

          {closure && (
            <Alert tone="closed" title={closure.title} className="mt-6">
              {closure.body}
              {closure.footnote ? ` ${closure.footnote}.` : ""}
            </Alert>
          )}

          <SpecGrid
            className="mt-8"
            items={[
              { label: "Duration", value: formatDuration(adventure.durationMinutes) },
              {
                label: "Minimum age",
                value: adventure.minAge ? `${adventure.minAge} years` : "—",
              },
              {
                label: "Weight",
                value:
                  adventure.minWeightKg && adventure.maxWeightKg
                    ? `${adventure.minWeightKg}–${adventure.maxWeightKg} kg`
                    : "—",
              },
              { label: "Grade", value: adventure.grade ?? "—" },
            ]}
          />

          <div className="mt-10">
            <Tabs
              tabs={[
                {
                  id: "about",
                  label: "About",
                  content: <p className="measure text-ink-muted">{adventure.description}</p>,
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
                        <li
                          key={i}
                          className="flex items-start gap-2.5 text-small text-ink-muted"
                        >
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

          {adventure.faqs.length > 0 && (
            <div className="mt-14">
              <SectionHeading as="h2" title="Questions people ask" />
              <Accordion className="mt-6" items={adventure.faqs} />
            </div>
          )}
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
                ["Duration", formatDuration(adventure.durationMinutes)],
                ["Grade", adventure.grade ?? "—"],
                ["Minimum age", adventure.minAge ? `${adventure.minAge} yrs` : "—"],
                ["Where", adventure.putInPoint ?? "Rishikesh"],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-4">
                  <span className="inline-flex items-center gap-1.5">
                    <Scale className="size-4" aria-hidden /> {k}
                  </span>
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
                  <ClosureTrigger closure={closure}>
                    Bookings closed — tap to see why
                  </ClosureTrigger>
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
          <SectionHeading as="h2" title="More adventures" />
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((a) => (
              <AdventureCard
                key={a.id}
                adventure={a}
                closure={resolveClosure(closures, {
                  service: "activity",
                  entityType: "adventure",
                  entityId: a.id,
                })}
                whatsappNumber={settings.whatsappNumber}
              />
            ))}
          </div>
        </section>
      )}

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
