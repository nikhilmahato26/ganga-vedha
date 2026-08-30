import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CalendarClock, MapPin, Navigation } from "lucide-react";
import {
  Accordion,
  Breadcrumb,
  Chip,
  EmptyState,
  LinkButton,
  MediaFrame,
  SectionHeading,
} from "@/components/ui";
import { HotelCard } from "@/components/site/product-card";
import { PackageCard } from "@/components/site/catalog-cards";
import {
  getClosures,
  getDestination,
  getDestinations,
  getHotels,
  getPackages,
  getSiteSettings,
} from "@/lib/content";
import { resolveClosure } from "@/lib/closure";

export const revalidate = 300;

export async function generateStaticParams() {
  const list = await getDestinations();
  return list.map((d) => ({ slug: d.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const d = await getDestination(slug);
  if (!d) return { title: "Not found" };
  return {
    title: `${d.name} — travel guide & stays`,
    description: d.tagline || d.intro.slice(0, 150),
    alternates: { canonical: `/stays/${d.slug}` },
    openGraph: { title: `${d.name} · Ganga Vedha`, description: d.tagline },
  };
}

export default async function DestinationDetail({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [destination, allHotels, allPackages, settings, closures, allDestinations] =
    await Promise.all([
      getDestination(slug),
      getHotels(),
      getPackages(),
      getSiteSettings(),
      getClosures(),
      getDestinations(),
    ]);
  if (!destination) notFound();

  const hotels = allHotels.filter((h) => h.destinationSlug === destination.slug);
  const packages = allPackages.filter((p) => p.destinationSlug === destination.slug);
  const others = allDestinations.filter((d) => d.id !== destination.id).slice(0, 4);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "TouristDestination",
    name: destination.name,
    description: destination.intro,
    address: {
      "@type": "PostalAddress",
      addressRegion: destination.region ?? undefined,
      addressCountry: "IN",
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
            { label: "Stays", href: "/stays" },
            { label: destination.name },
          ]}
        />
      </div>

      <div className="container-page pt-6">
        <MediaFrame
          media={destination.coverMedia ?? null}
          ratio="wide"
          standInSeed={destination.slug}
          priority
          className="rounded-xl"
          emptyLabel={`${destination.name} — photograph pending`}
        >
          <div className="absolute inset-x-0 bottom-0 flex flex-wrap items-end gap-2 p-4">
            {destination.region && <Chip tone="onMedia">{destination.region}</Chip>}
          </div>
        </MediaFrame>
      </div>

      <div className="container-page pt-10">
        <h1 className="text-display-lg text-ink">{destination.name}</h1>
        <p className="mt-3 measure text-subtitle font-normal text-ink-muted">
          {destination.tagline}
        </p>
        <p className="mt-6 measure text-ink-muted">{destination.intro}</p>

        <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_20rem]">
          <div>
            {destination.highlights.length > 0 && (
              <>
                <h2 className="text-subtitle text-ink">Best experiences</h2>
                <ul className="mt-4 space-y-2.5">
                  {destination.highlights.map((h) => (
                    <li
                      key={h}
                      className="flex items-start gap-2.5 text-small text-ink-muted"
                    >
                      <span
                        className="mt-2 size-1.5 shrink-0 rounded-full bg-jade-500"
                        aria-hidden
                      />
                      {h}
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
          <aside className="space-y-4 rounded-lg border border-hairline p-5 text-small">
            {destination.bestTime && (
              <div>
                <p className="inline-flex items-center gap-1.5 font-semibold text-ink">
                  <CalendarClock className="size-4" aria-hidden /> Best time to visit
                </p>
                <p className="mt-1 text-ink-muted">{destination.bestTime}</p>
              </div>
            )}
            {destination.howToReach && (
              <div>
                <p className="inline-flex items-center gap-1.5 font-semibold text-ink">
                  <Navigation className="size-4" aria-hidden /> How to reach
                </p>
                <p className="mt-1 text-ink-muted">{destination.howToReach}</p>
              </div>
            )}
          </aside>
        </div>
      </div>

      {/* Stays in this destination */}
      <section className="container-page pt-16">
        <SectionHeading as="h2" title={`Where to stay in ${destination.name}`} />
        {hotels.length === 0 ? (
          <EmptyState
            className="mt-8"
            icon={<MapPin />}
            title="No stays listed here yet"
            description="We can still arrange accommodation on request — send us an enquiry with your dates."
          />
        ) : (
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {hotels.map((h) => (
              <HotelCard
                key={h.id}
                hotel={h}
                closure={resolveClosure(closures, {
                  service: "hotel",
                  entityType: "hotel",
                  entityId: h.id,
                })}
                whatsappNumber={settings.whatsappNumber}
              />
            ))}
          </div>
        )}
      </section>

      {/* Packages that visit this destination */}
      {packages.length > 0 && (
        <section className="container-page pt-16">
          <SectionHeading as="h2" title={`Packages visiting ${destination.name}`} />
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {packages.map((p) => (
              <PackageCard key={p.id} pkg={p} whatsappNumber={settings.whatsappNumber} />
            ))}
          </div>
        </section>
      )}

      {destination.faqs.length > 0 && (
        <section className="container-page pt-16">
          <SectionHeading as="h2" title={`${destination.name} — questions people ask`} />
          <Accordion className="mt-6" items={destination.faqs} />
        </section>
      )}

      {others.length > 0 && (
        <section className="container-page pt-16 pb-4">
          <SectionHeading as="h2" title="Other destinations" />
          <div className="mt-6 flex flex-wrap gap-3">
            {others.map((d) => (
              <LinkButton key={d.id} href={`/stays/${d.slug}`} variant="outline">
                {d.name}
              </LinkButton>
            ))}
          </div>
        </section>
      )}
    </>
  );
}
