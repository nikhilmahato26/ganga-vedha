import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  BedDouble,
  Clock,
  MapPin,
  Users,
  Wifi,
  Utensils,
  Flame,
  Car,
  Zap,
  Waves,
  Shirt,
  Droplets,
  ShieldCheck,
  Plane,
  Volleyball,
  ConciergeBell,
} from "lucide-react";
import {
  Accordion,
  Alert,
  Breadcrumb,
  Card,
  CardBody,
  Chip,
  LinkButton,
  MediaFrame,
  Rating,
  SectionHeading,
  Tabs,
} from "@/components/ui";
import { EnquireButton } from "@/components/site/enquiry";
import { BookingPanel, SpecGrid } from "@/components/site/detail";
import { ClosureNotice } from "@/components/site/chrome";
import { getClosures, getHotel, getHotels, getSiteSettings } from "@/lib/content";
import { isBookable, resolveClosure } from "@/lib/closure";
import { formatINR } from "@/lib/format";

// 60s: matches the hotels cache window in @/lib/content.
export const revalidate = 60;

/** Amenity keys map to drawn icons — never an emoji standing in for one. */
const AMENITY_ICON: Record<string, typeof Wifi> = {
  "Free Wi-Fi": Wifi,
  "Hot water": Droplets,
  "All meals included": Utensils,
  "Terrace restaurant": Utensils,
  Bonfire: Flame,
  Parking: Car,
  "Power backup": Zap,
  "Beach access": Waves,
  Laundry: Shirt,
  Volleyball: Volleyball,
  "Attached washroom": Droplets,
  "Room service": ConciergeBell,
  "Airport transfer on request": Plane,
};

export async function generateStaticParams() {
  const list = await getHotels();
  return list.map((h) => ({ slug: h.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const h = await getHotel(slug);
  if (!h) return { title: "Not found" };
  return {
    title: h.name,
    description: h.tagline,
    alternates: { canonical: `/hotels/${h.slug}` },
    openGraph: { title: `${h.name} · Ganga Vedha`, description: h.tagline },
  };
}

export default async function HotelDetail({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [hotel, settings, closures] = await Promise.all([
    getHotel(slug),
    getSiteSettings(),
    getClosures(),
  ]);
  if (!hotel) notFound();

  const open = isBookable(closures, {
    service: "hotel",
    entityType: "hotel",
    entityId: hotel.id,
  });
  const closure = resolveClosure(closures, {
    service: "hotel",
    entityType: "hotel",
    entityId: hotel.id,
  });

  const product = {
    kind: "hotel" as const,
    slug: hotel.slug,
    name: hotel.name,
    priceInr: hotel.pricePerNightInr,
    priceUnit: "per night",
  };

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Hotel",
    name: hotel.name,
    description: hotel.tagline,
    address: { "@type": "PostalAddress", streetAddress: hotel.address },
    starRating: hotel.starRating
      ? { "@type": "Rating", ratingValue: hotel.starRating }
      : undefined,
    priceRange: `₹${hotel.pricePerNightInr}+`,
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
            { label: "Stays", href: "/hotels" },
            { label: hotel.name },
          ]}
        />
      </div>

      {/* Gallery: one lead frame plus a strip, the shape a real photo set fills. */}
      <div className="container-page grid gap-3 pt-6 lg:grid-cols-[2fr_1fr]">
        <MediaFrame
          media={hotel.gallery?.[0] ?? hotel.coverMedia ?? null}
          ratio="wide"
          standInSeed={hotel.slug}
          priority
          className="rounded-xl"
          emptyLabel={`${hotel.name} — photograph pending`}
        >
          <div className="absolute inset-x-0 top-0 flex flex-wrap gap-2 p-4">
            <Chip tone="onMedia" icon={<MapPin />}>{hotel.locality}</Chip>
            {hotel.starRating && (
              <Chip tone="onMedia">{"★".repeat(hotel.starRating)}</Chip>
            )}
          </div>
        </MediaFrame>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-1">
          {(["a", "b"] as const).map((k, i) => (
            <MediaFrame
              key={k}
              media={hotel.gallery?.[i + 1] ?? null}
              ratio="wide"
              standInSeed={`${hotel.slug}-${k}`}
              className="rounded-lg"
              scrim={false}
              emptyLabel="Photograph pending"
            />
          ))}
        </div>
      </div>

      <div className="container-page grid gap-12 pt-10 lg:grid-cols-[1fr_22rem]">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-display-lg text-ink">{hotel.name}</h1>
            {hotel.badge && <Chip tone="ember">{hotel.badge}</Chip>}
          </div>
          <p className="mt-3 measure text-subtitle font-normal text-ink-muted">
            {hotel.tagline}
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-small text-ink-muted">
            {hotel.rating !== null && (
              <Rating value={hotel.rating} count={hotel.reviewCount} />
            )}
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="size-4" aria-hidden /> {hotel.address}
            </span>
          </div>

          {closure && (
            <Alert tone="closed" title={closure.title} className="mt-6">
              {closure.body}
            </Alert>
          )}
          {/* Rafting and global closures already get the full-screen takeover from
              the site layout, on every page — it would double up here. Hotel
              closures have no such sitewide check (a hotel closure has no reason
              to interrupt someone browsing rafting), so this page shows its own. */}
          {(closure?.scope === "entity" || closure?.scope === "service") && (
            <ClosureNotice closure={closure} />
          )}

          <SpecGrid
            className="mt-8"
            items={[
              { label: "Check in", value: hotel.checkInTime },
              { label: "Check out", value: hotel.checkOutTime },
              {
                label: "Rooms",
                value: `${hotel.rooms.length} ${hotel.rooms.length === 1 ? "type" : "types"}`,
              },
              {
                label: "Sleeps up to",
                value: `${Math.max(...hotel.rooms.map((r) => r.occupancy))} per room`,
              },
            ]}
          />

          <div className="mt-10">
            <Tabs
              tabs={[
                {
                  id: "about",
                  label: "About",
                  content: <p className="measure text-ink-muted">{hotel.description}</p>,
                },
                {
                  id: "amenities",
                  label: "Amenities",
                  content: (
                    <ul className="grid gap-3 sm:grid-cols-2">
                      {hotel.amenities.map((a) => {
                        const Icon = AMENITY_ICON[a] ?? ShieldCheck;
                        return (
                          <li key={a} className="flex items-center gap-2.5 text-small text-ink-muted">
                            <Icon className="size-4 shrink-0 text-jade-600" aria-hidden />
                            {a}
                          </li>
                        );
                      })}
                    </ul>
                  ),
                },
                {
                  id: "rules",
                  label: "House rules",
                  content: (
                    <ul className="measure space-y-2.5">
                      {hotel.houseRules.map((r) => (
                        <li key={r} className="flex items-start gap-2.5 text-small text-ink-muted">
                          <ShieldCheck className="mt-0.5 size-4 shrink-0 text-ink-faint" aria-hidden />
                          {r}
                        </li>
                      ))}
                    </ul>
                  ),
                },
                {
                  id: "location",
                  label: "Location",
                  content: (
                    <div className="space-y-4">
                      <p className="measure text-ink-muted">{hotel.address}</p>
                      {hotel.mapUrl && (
                        <LinkButton
                          href={hotel.mapUrl}
                          target="_blank"
                          rel="noopener"
                          variant="outline"
                        >
                          <MapPin className="size-4" aria-hidden /> Open in Maps
                        </LinkButton>
                      )}
                    </div>
                  ),
                },
              ]}
            />
          </div>

          {/* Room types — the part a hotel page exists for. */}
          <div className="mt-14">
            <SectionHeading as="h2" title="Rooms" />
            <div className="mt-6 space-y-4">
              {hotel.rooms.map((room) => (
                <Card key={room.id} elevation="flat">
                  <div className="grid gap-0 sm:grid-cols-[14rem_1fr]">
                    <MediaFrame
                      media={room.coverMedia ?? null}
                      ratio="card"
                      standInSeed={`${hotel.slug}-room-${room.id}`}
                      scrim={false}
                      emptyLabel="Room photograph pending"
                      className="sm:h-full sm:aspect-auto"
                    />
                    <CardBody className="flex flex-col justify-between gap-4 p-5">
                      <div>
                        <h3 className="text-subtitle text-ink">{room.name}</h3>
                        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-small text-ink-muted">
                          <span className="inline-flex items-center gap-1.5">
                            <Users className="size-4" aria-hidden /> Sleeps {room.occupancy}
                          </span>
                          <span className="inline-flex items-center gap-1.5">
                            <BedDouble className="size-4" aria-hidden /> {room.bedType}
                          </span>
                        </div>
                        <ul className="mt-3 flex flex-wrap gap-1.5">
                          {room.inclusions.map((i) => (
                            <li key={i}>
                              <Chip size="sm">{i}</Chip>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="flex items-end justify-between gap-3">
                        <div>
                          <p className="tabular text-title leading-none text-ink">
                            {formatINR(room.pricePerNightInr)}
                          </p>
                          <p className="mt-1 text-caption text-ink-faint">per night</p>
                        </div>
                        {open && (
                          <EnquireButton
                            source="detail"
                            whatsappNumber={settings.whatsappNumber}
                            product={{ ...product, name: `${hotel.name} — ${room.name}`, priceInr: room.pricePerNightInr }}
                          >
                            Enquire
                          </EnquireButton>
                        )}
                      </div>
                    </CardBody>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {hotel.faqs.length > 0 && (
            <div className="mt-14">
              <SectionHeading as="h2" title="Questions people ask" />
              <Accordion className="mt-6" items={hotel.faqs} />
            </div>
          )}
        </div>

        <aside className="lg:min-w-0">
          <BookingPanel>
            <p className="tabular text-display-md leading-none text-ink">
              {formatINR(hotel.pricePerNightInr)}
            </p>
            <p className="mt-1.5 text-small text-ink-faint">
              {hotel.compareAtPriceInr && (
                <s className="tabular mr-1.5">{formatINR(hotel.compareAtPriceInr)}</s>
              )}
              per night, from
            </p>
            <div className="mt-6 space-y-3 border-t border-hairline pt-6 text-small text-ink-muted">
              {[
                ["Check in", hotel.checkInTime],
                ["Check out", hotel.checkOutTime],
                ["Locality", hotel.locality],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-4">
                  <span className="inline-flex items-center gap-1.5">
                    <Clock className="size-4" aria-hidden /> {k}
                  </span>
                  <span className="font-semibold text-ink">{v}</span>
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
                >
                  Check dates
                </EnquireButton>
              ) : (
                <div className="rounded-md bg-granite-100 p-4 text-center text-small text-ink-muted">
                  This property is not taking bookings right now.
                </div>
              )}
            </div>
            <p className="mt-3 text-center text-caption text-ink-faint">
              Nothing is charged now — we confirm on WhatsApp first.
            </p>
          </BookingPanel>
        </aside>
      </div>

      {open && (
        <div className="sticky-action-bar fixed inset-x-0 bottom-0 z-(--z-sticky) border-t border-hairline bg-canvas/95 px-4 pt-3 pb-safe backdrop-blur-sm lg:hidden">
          <div className="flex items-center gap-3">
            <div className="min-w-0 flex-1">
              <p className="tabular text-title leading-none text-ink">
                {formatINR(hotel.pricePerNightInr)}
              </p>
              <p className="mt-1 text-caption text-ink-faint">per night</p>
            </div>
            <EnquireButton
              size="lg"
              source="detail"
              product={product}
              whatsappNumber={settings.whatsappNumber}
            >
              Check dates
            </EnquireButton>
          </div>
        </div>
      )}
      <div className="h-24 lg:hidden" aria-hidden />
    </>
  );
}
