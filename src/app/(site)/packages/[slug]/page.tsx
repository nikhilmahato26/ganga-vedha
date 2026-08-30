import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarDays, MapPin, Route } from "lucide-react";
import {
  Accordion,
  Breadcrumb,
  Chip,
  MediaFrame,
  SectionHeading,
  Tabs,
} from "@/components/ui";
import { EnquireButton } from "@/components/site/enquiry";
import { BookingPanel, IncludedList, SpecGrid } from "@/components/site/detail";
import { getPackage, getPackages, getSiteSettings } from "@/lib/content";
import { formatINR } from "@/lib/format";

export const revalidate = 120;

export async function generateStaticParams() {
  const list = await getPackages();
  return list.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const p = await getPackage(slug);
  if (!p) return { title: "Not found" };
  return {
    title: p.name,
    description: p.summary,
    alternates: { canonical: `/packages/${p.slug}` },
    openGraph: { title: `${p.name} · Ganga Vedha`, description: p.summary },
  };
}

export default async function PackageDetail({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [pkg, settings, all] = await Promise.all([
    getPackage(slug),
    getSiteSettings(),
    getPackages(),
  ]);
  if (!pkg) notFound();

  const related = all.filter((p) => p.id !== pkg.id).slice(0, 3);

  const product = {
    kind: "package" as const,
    slug: pkg.slug,
    name: pkg.name,
    priceInr: pkg.priceInr,
    priceUnit: pkg.priceNote ?? "per person",
  };

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: pkg.name,
    description: pkg.summary,
    brand: { "@type": "Brand", name: settings.brandName },
    offers: {
      "@type": "Offer",
      price: pkg.priceInr,
      priceCurrency: "INR",
      availability: "https://schema.org/InStock",
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
            { label: "Packages", href: "/packages" },
            { label: pkg.name },
          ]}
        />
      </div>

      <div className="container-page pt-6">
        <MediaFrame
          media={pkg.coverMedia ?? null}
          ratio="wide"
          standInSeed={pkg.slug}
          priority
          className="rounded-xl"
          emptyLabel={`${pkg.name} — photograph pending`}
        >
          <div className="absolute inset-x-0 top-0 flex flex-wrap items-start gap-2 p-4">
            {pkg.durationLabel && (
              <Chip tone="onMedia" icon={<CalendarDays />}>
                {pkg.durationLabel}
              </Chip>
            )}
            {pkg.routeLabel && (
              <Chip tone="onMedia" icon={<Route />}>
                {pkg.routeLabel}
              </Chip>
            )}
          </div>
        </MediaFrame>
      </div>

      <div className="container-page grid gap-12 pt-10 lg:grid-cols-[1fr_22rem]">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-display-lg text-ink">{pkg.name}</h1>
            {pkg.badge && <Chip tone="ember">{pkg.badge}</Chip>}
          </div>
          <p className="mt-3 measure text-subtitle font-normal text-ink-muted">
            {pkg.summary}
          </p>
          {pkg.destinationSlug && (
            <p className="mt-3 text-small text-ink-muted">
              <MapPin className="mr-1.5 inline size-4" aria-hidden />
              Based around{" "}
              <Link
                href={`/stays/${pkg.destinationSlug}`}
                className="font-semibold text-link hover:underline"
              >
                {pkg.destinationSlug.replace(/-/g, " ")}
              </Link>
            </p>
          )}

          <SpecGrid
            className="mt-8"
            items={[
              { label: "Duration", value: pkg.durationLabel ?? "—" },
              { label: "Nights", value: pkg.nights != null ? String(pkg.nights) : "—" },
              { label: "Type", value: pkg.category ?? "—" },
              { label: "From", value: formatINR(pkg.priceInr) },
            ]}
          />

          <div className="mt-10">
            <Tabs
              tabs={[
                {
                  id: "overview",
                  label: "Overview",
                  content: <p className="measure text-ink-muted">{pkg.description}</p>,
                },
                {
                  id: "itinerary",
                  label: "Itinerary",
                  content:
                    pkg.itinerary.length > 0 ? (
                      <ol className="space-y-4">
                        {pkg.itinerary.map((d, i) => (
                          <li key={i} className="flex gap-4">
                            <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-md bg-jade-100 text-caption font-semibold text-jade-800">
                              {i + 1}
                            </span>
                            <div>
                              <p className="text-small font-semibold text-ink">{d.title}</p>
                              <p className="mt-0.5 measure text-small text-ink-muted">
                                {d.detail}
                              </p>
                            </div>
                          </li>
                        ))}
                      </ol>
                    ) : (
                      <p className="text-small text-ink-muted">
                        Detailed day-by-day itinerary shared on enquiry.
                      </p>
                    ),
                },
                {
                  id: "included",
                  label: "Inclusions",
                  content: (
                    <IncludedList
                      inclusions={pkg.inclusions}
                      exclusions={pkg.exclusions}
                    />
                  ),
                },
                {
                  id: "logistics",
                  label: "Stay, transport & meals",
                  content: (
                    <dl className="measure space-y-4 text-small">
                      {[
                        ["Accommodation", pkg.accommodationNote],
                        ["Transport", pkg.transportNote],
                        ["Meals", pkg.mealsNote],
                      ]
                        .filter(([, v]) => v)
                        .map(([k, v]) => (
                          <div key={k}>
                            <dt className="font-semibold text-ink">{k}</dt>
                            <dd className="mt-1 text-ink-muted">{v}</dd>
                          </div>
                        ))}
                    </dl>
                  ),
                },
                ...(pkg.terms.length > 0
                  ? [
                      {
                        id: "terms",
                        label: "Terms",
                        content: (
                          <ul className="measure space-y-2.5">
                            {pkg.terms.map((t) => (
                              <li
                                key={t}
                                className="flex items-start gap-2.5 text-small text-ink-muted"
                              >
                                <span
                                  className="mt-2 size-1.5 shrink-0 rounded-full bg-ink-faint"
                                  aria-hidden
                                />
                                {t}
                              </li>
                            ))}
                          </ul>
                        ),
                      },
                    ]
                  : []),
              ]}
            />
          </div>

          {pkg.faqs.length > 0 && (
            <div className="mt-14">
              <SectionHeading as="h2" title="Questions people ask" />
              <Accordion className="mt-6" items={pkg.faqs} />
            </div>
          )}
        </div>

        <aside className="lg:min-w-0">
          <BookingPanel>
            <p className="tabular text-display-md leading-none text-ink">
              {formatINR(pkg.priceInr)}
            </p>
            <p className="mt-1.5 text-small text-ink-faint">
              {pkg.compareAtPriceInr && (
                <s className="tabular mr-1.5">{formatINR(pkg.compareAtPriceInr)}</s>
              )}
              {pkg.priceNote ?? "from · per person"}
            </p>

            <div className="mt-6 space-y-3 border-t border-hairline pt-6 text-small text-ink-muted">
              {[
                ["Duration", pkg.durationLabel ?? "—"],
                ["Route", pkg.routeLabel ?? "—"],
                ["Type", pkg.category ?? "—"],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-4">
                  <span>{k}</span>
                  <span className="font-semibold text-ink">{v}</span>
                </div>
              ))}
            </div>

            <div className="mt-6">
              <EnquireButton
                block
                size="lg"
                source="detail"
                product={product}
                whatsappNumber={settings.whatsappNumber}
              >
                Enquire about this package
              </EnquireButton>
            </div>
            <p className="mt-3 text-center text-caption text-ink-faint">
              Nothing is charged now — we confirm the quote for your dates on WhatsApp.
            </p>
          </BookingPanel>
        </aside>
      </div>

      {related.length > 0 && (
        <section className="container-page pt-24">
          <SectionHeading as="h2" title="Other packages" />
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((p) => (
              <Link
                key={p.id}
                href={`/packages/${p.slug}`}
                className="block rounded-lg border border-hairline p-5 no-underline transition-colors hover:bg-canvas-sunk"
              >
                <p className="text-caption text-ink-faint">{p.durationLabel}</p>
                <p className="mt-1 text-subtitle text-ink">{p.name}</p>
                <p className="mt-2 text-small text-ink-muted">{p.summary}</p>
                <p className="mt-3 tabular text-small font-semibold text-ink">
                  From {formatINR(p.priceInr)}
                </p>
              </Link>
            ))}
          </div>
        </section>
      )}

      <div className="sticky-action-bar fixed inset-x-0 bottom-0 z-(--z-sticky) border-t border-hairline bg-canvas/95 px-4 pt-3 pb-safe backdrop-blur-sm lg:hidden">
        <div className="flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="tabular text-title leading-none text-ink">
              {formatINR(pkg.priceInr)}
            </p>
            <p className="mt-1 text-caption text-ink-faint">{pkg.priceNote ?? "from"}</p>
          </div>
          <EnquireButton
            size="lg"
            source="detail"
            product={product}
            whatsappNumber={settings.whatsappNumber}
          >
            Enquire
          </EnquireButton>
        </div>
      </div>
      <div className="h-24 lg:hidden" aria-hidden />
    </>
  );
}
