import Link from "next/link";
import { ArrowRight, Bike, CalendarDays, Car, MapPin, Route } from "lucide-react";
import { Card, CardBody, Chip, MediaFrame } from "@/components/ui";
import { EnquireButton, type EnquiryProduct } from "./enquiry";
import { formatINR } from "@/lib/format";
import type { Destination, Package, Rental } from "@/lib/content";

/** Holiday-package card for the /packages grid and destination pages. */
export function PackageCard({
  pkg,
  whatsappNumber,
}: {
  pkg: Package;
  whatsappNumber: string;
}) {
  const href = `/packages/${pkg.slug}`;
  const product: EnquiryProduct = {
    kind: "package",
    slug: pkg.slug,
    name: pkg.name,
    priceInr: pkg.priceInr,
    priceUnit: pkg.priceNote ?? "per person",
  };

  return (
    <Card interactive className="flex flex-col">
      <Link href={href} className="block no-underline">
        <MediaFrame
          media={pkg.coverMedia ?? null}
          ratio="card"
          standInSeed={pkg.slug}
          emptyLabel={`${pkg.name} — photograph pending`}
        >
          <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-2 p-3">
            {pkg.durationLabel && (
              <Chip tone="onMedia" size="sm" icon={<CalendarDays />}>
                {pkg.durationLabel}
              </Chip>
            )}
            {pkg.category && (
              <Chip tone="onMedia" size="sm">
                {pkg.category}
              </Chip>
            )}
          </div>
        </MediaFrame>
      </Link>

      <CardBody className="flex flex-1 flex-col gap-4">
        <div className="flex-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="min-w-0 flex-1 text-title text-ink">
              <Link href={href} className="text-ink no-underline hover:underline">
                {pkg.name}
              </Link>
            </h3>
            {pkg.badge && (
              <Chip tone="ember" size="sm" className="mt-0.5 shrink-0">
                {pkg.badge}
              </Chip>
            )}
          </div>
          {pkg.routeLabel && (
            <p className="mt-1.5 inline-flex items-center gap-1.5 text-caption text-ink-faint">
              <Route className="size-3.5" aria-hidden /> {pkg.routeLabel}
            </p>
          )}
          <p className="mt-1.5 text-small text-ink-muted">{pkg.summary}</p>
        </div>

        <div className="flex items-end justify-between gap-3 border-t border-hairline pt-4">
          <div>
            <p className="text-display-md tabular leading-none text-ink">
              {formatINR(pkg.priceInr)}
            </p>
            <p className="mt-1.5 text-caption text-ink-faint">
              {pkg.compareAtPriceInr && (
                <s className="tabular mr-1">{formatINR(pkg.compareAtPriceInr)}</s>
              )}
              {pkg.priceNote ?? "from · per person"}
            </p>
          </div>
          <EnquireButton product={product} whatsappNumber={whatsappNumber} source="card">
            Enquire <ArrowRight className="size-4" aria-hidden />
          </EnquireButton>
        </div>
      </CardBody>
    </Card>
  );
}

/** Car / bike rental card. */
export function RentalCard({
  rental,
  whatsappNumber,
}: {
  rental: Rental;
  whatsappNumber: string;
}) {
  const href = `/rentals/${rental.slug}`;
  const Icon = rental.kind === "bike" ? Bike : Car;
  const product: EnquiryProduct = {
    kind: "rental",
    slug: rental.slug,
    name: rental.name,
    priceInr: rental.quoteOnly ? null : rental.perDayInr,
    priceUnit: "per day",
  };

  return (
    <Card interactive className="flex flex-col">
      <Link href={href} className="block no-underline">
        <MediaFrame
          media={rental.coverMedia ?? null}
          ratio="card"
          standInSeed={rental.slug}
          emptyLabel={`${rental.name} — photograph pending`}
        >
          <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-2 p-3">
            <span className="grid size-9 place-items-center rounded-md bg-canvas/90 text-jade-800">
              <Icon className="size-4.5" aria-hidden />
            </span>
            {rental.quoteOnly && (
              <Chip tone="onMedia" size="sm">
                Custom quote
              </Chip>
            )}
          </div>
        </MediaFrame>
      </Link>

      <CardBody className="flex flex-1 flex-col gap-4">
        <div className="flex-1">
          <h3 className="text-title text-ink">
            <Link href={href} className="text-ink no-underline hover:underline">
              {rental.name}
            </Link>
          </h3>
          <p className="mt-1.5 text-small text-ink-muted">{rental.summary}</p>
        </div>

        <div className="flex items-end justify-between gap-3 border-t border-hairline pt-4">
          <div>
            {rental.quoteOnly ? (
              <p className="text-subtitle text-ink">On request</p>
            ) : (
              <>
                <p className="text-display-md tabular leading-none text-ink">
                  {formatINR(rental.perDayInr)}
                </p>
                <p className="mt-1.5 text-caption text-ink-faint">per day</p>
              </>
            )}
          </div>
          <EnquireButton product={product} whatsappNumber={whatsappNumber} source="card">
            {rental.quoteOnly ? "Get a quote" : "Enquire"}
            <ArrowRight className="size-4" aria-hidden />
          </EnquireButton>
        </div>
      </CardBody>
    </Card>
  );
}

/** Destination card for the /stays index. */
export function DestinationCard({ destination }: { destination: Destination }) {
  const href = `/stays/${destination.slug}`;
  return (
    <Card interactive className="flex flex-col">
      <Link href={href} className="block no-underline">
        <MediaFrame
          media={destination.coverMedia ?? null}
          ratio="card"
          standInSeed={destination.slug}
          emptyLabel={`${destination.name} — photograph pending`}
        >
          <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-2 p-3">
            <Chip tone="onMedia" size="sm" icon={<MapPin />}>
              {destination.name}
            </Chip>
            {destination.region && (
              <Chip tone="onMedia" size="sm">
                {destination.region}
              </Chip>
            )}
          </div>
        </MediaFrame>
      </Link>
      <CardBody className="flex flex-1 flex-col gap-3">
        <div className="flex-1">
          <h3 className="text-title text-ink">
            <Link href={href} className="text-ink no-underline hover:underline">
              {destination.name}
            </Link>
          </h3>
          <p className="mt-1.5 text-small text-ink-muted">{destination.tagline}</p>
        </div>
        <Link
          href={href}
          className="inline-flex items-center gap-1.5 text-small font-semibold text-link no-underline hover:underline"
        >
          Explore {destination.name} <ArrowRight className="size-4" aria-hidden />
        </Link>
      </CardBody>
    </Card>
  );
}
