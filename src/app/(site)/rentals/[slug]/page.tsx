import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Bike, Car, FileText, MapPin } from "lucide-react";
import {
  Accordion,
  Breadcrumb,
  Chip,
  MediaFrame,
  SectionHeading,
  Tabs,
} from "@/components/ui";
import { EnquireButton } from "@/components/site/enquiry";
import { BookingPanel, SpecGrid } from "@/components/site/detail";
import { getRental, getRentals, getSiteSettings } from "@/lib/content";
import { formatINR } from "@/lib/format";

export const revalidate = 300;

export async function generateStaticParams() {
  const list = await getRentals();
  return list.map((r) => ({ slug: r.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const r = await getRental(slug);
  if (!r) return { title: "Not found" };
  return {
    title: r.name,
    description: r.summary,
    alternates: { canonical: `/rentals/${r.slug}` },
    openGraph: { title: `${r.name} · Ganga Vedha`, description: r.summary },
  };
}

export default async function RentalDetail({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [rental, settings] = await Promise.all([getRental(slug), getSiteSettings()]);
  if (!rental) notFound();

  const Icon = rental.kind === "bike" ? Bike : Car;
  const product = {
    kind: "rental" as const,
    slug: rental.slug,
    name: rental.name,
    priceInr: rental.quoteOnly ? null : rental.perDayInr,
    priceUnit: "per day",
  };

  return (
    <>
      <div className="container-page pt-6">
        <Breadcrumb
          items={[
            { label: "Home", href: "/" },
            { label: "Rentals", href: "/rentals" },
            { label: rental.name },
          ]}
        />
      </div>

      <div className="container-page pt-6">
        <MediaFrame
          media={rental.coverMedia ?? null}
          ratio="wide"
          standInSeed={rental.slug}
          priority
          className="rounded-xl"
          emptyLabel={`${rental.name} — photograph pending`}
        >
          <div className="absolute inset-x-0 top-0 flex flex-wrap items-start gap-2 p-4">
            <span className="grid size-10 place-items-center rounded-md bg-canvas/90 text-jade-800">
              <Icon className="size-5" aria-hidden />
            </span>
            {rental.quoteOnly && <Chip tone="onMedia">Custom quote</Chip>}
          </div>
        </MediaFrame>
      </div>

      <div className="container-page grid gap-12 pt-10 lg:grid-cols-[1fr_22rem]">
        <div className="min-w-0">
          <h1 className="text-display-lg text-ink">{rental.name}</h1>
          <p className="mt-3 measure text-subtitle font-normal text-ink-muted">
            {rental.summary}
          </p>

          <SpecGrid
            className="mt-8"
            items={[
              {
                label: "Rate",
                value: rental.quoteOnly ? "On request" : `${formatINR(rental.perDayInr)}/day`,
              },
              {
                label: "Deposit",
                value: rental.depositInr ? formatINR(rental.depositInr) : "—",
              },
              { label: "Type", value: rental.transmission ?? (rental.kind === "bike" ? "Two-wheeler" : "Car") },
              {
                label: rental.kind === "car" ? "Seats" : "Fuel",
                value:
                  rental.kind === "car"
                    ? rental.seats
                      ? `Up to ${rental.seats}`
                      : "—"
                    : "Not included",
              },
            ]}
          />

          <div className="mt-10">
            <Tabs
              tabs={[
                {
                  id: "about",
                  label: "About",
                  content: <p className="measure text-ink-muted">{rental.description}</p>,
                },
                ...(rental.includes.length > 0
                  ? [
                      {
                        id: "includes",
                        label: "What's included",
                        content: (
                          <ul className="measure space-y-2.5">
                            {rental.includes.map((i) => (
                              <li
                                key={i}
                                className="flex items-start gap-2.5 text-small text-ink-muted"
                              >
                                <span
                                  className="mt-2 size-1.5 shrink-0 rounded-full bg-open"
                                  aria-hidden
                                />
                                {i}
                              </li>
                            ))}
                          </ul>
                        ),
                      },
                    ]
                  : []),
                {
                  id: "docs",
                  label: "Documents needed",
                  content: (
                    <ul className="measure space-y-2.5">
                      {rental.documentsRequired.map((d) => (
                        <li
                          key={d}
                          className="flex items-start gap-2.5 text-small text-ink-muted"
                        >
                          <FileText className="mt-0.5 size-4 shrink-0 text-ink-faint" aria-hidden />
                          {d}
                        </li>
                      ))}
                    </ul>
                  ),
                },
                ...(rental.terms.length > 0
                  ? [
                      {
                        id: "terms",
                        label: "Terms",
                        content: (
                          <ul className="measure space-y-2.5">
                            {rental.terms.map((t) => (
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
                ...(rental.pickupNote
                  ? [
                      {
                        id: "pickup",
                        label: "Pickup",
                        content: (
                          <p className="measure text-ink-muted">
                            <MapPin className="mr-1.5 inline size-4" aria-hidden />
                            {rental.pickupNote}
                          </p>
                        ),
                      },
                    ]
                  : []),
              ]}
            />
          </div>

          {rental.faqs.length > 0 && (
            <div className="mt-14">
              <SectionHeading as="h2" title="Questions people ask" />
              <Accordion className="mt-6" items={rental.faqs} />
            </div>
          )}
        </div>

        <aside className="lg:min-w-0">
          <BookingPanel>
            {rental.quoteOnly ? (
              <>
                <p className="text-display-md leading-none text-ink">On request</p>
                <p className="mt-1.5 text-small text-ink-faint">Priced per route</p>
              </>
            ) : (
              <>
                <p className="tabular text-display-md leading-none text-ink">
                  {formatINR(rental.perDayInr)}
                </p>
                <p className="mt-1.5 text-small text-ink-faint">per day</p>
              </>
            )}

            <div className="mt-6 space-y-3 border-t border-hairline pt-6 text-small text-ink-muted">
              {[
                ["Deposit", rental.depositInr ? formatINR(rental.depositInr) : "On request"],
                ["Fuel", rental.fuelNote ?? "—"],
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
                {rental.quoteOnly ? "Request a quote" : "Check availability"}
              </EnquireButton>
            </div>
            <p className="mt-3 text-center text-caption text-ink-faint">
              Nothing is charged now — we confirm on WhatsApp first.
            </p>
          </BookingPanel>
        </aside>
      </div>

      <div className="sticky-action-bar fixed inset-x-0 bottom-0 z-(--z-sticky) border-t border-hairline bg-canvas/95 px-4 pt-3 pb-safe backdrop-blur-sm lg:hidden">
        <div className="flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="tabular text-title leading-none text-ink">
              {rental.quoteOnly ? "On request" : formatINR(rental.perDayInr)}
            </p>
            <p className="mt-1 text-caption text-ink-faint">
              {rental.quoteOnly ? "per route" : "per day"}
            </p>
          </div>
          <EnquireButton
            size="lg"
            source="detail"
            product={product}
            whatsappNumber={settings.whatsappNumber}
          >
            {rental.quoteOnly ? "Get a quote" : "Enquire"}
          </EnquireButton>
        </div>
      </div>
      <div className="h-24 lg:hidden" aria-hidden />
    </>
  );
}
