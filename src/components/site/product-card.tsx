import Link from "next/link";
import { ArrowRight, Clock, Mountain, Route, Users } from "lucide-react";
import {
  AvailabilityPill,
  Card,
  CardBody,
  Chip,
  GradeChip,
  MediaFrame,
  Rating,
  StatRow,
} from "@/components/ui";
import { formatDurationShort, formatINR, formatKm } from "@/lib/format";
import { EnquireButton, type EnquiryProduct } from "./enquiry";
import { ClosureLink } from "./chrome";
import type { Adventure, Closure, Hotel } from "@/lib/content";

/** Plain navigation when open; shows the closure card first, every time, when not. */
export function CardLink({
  closure,
  href,
  className,
  children,
}: {
  closure: Closure | null;
  href: string;
  className?: string;
  children: React.ReactNode;
}) {
  if (closure) {
    return (
      <ClosureLink closure={closure} href={href} className={className}>
        {children}
      </ClosureLink>
    );
  }
  return (
    <Link href={href} className={className}>
      {children}
    </Link>
  );
}

function PriceBlock({
  price,
  compareAt,
  unit,
}: {
  price: number;
  compareAt: number | null;
  unit: string;
}) {
  return (
    <div>
      {/* The number people argue about is the biggest thing in the block. */}
      <p className="text-display-md tabular leading-none text-ink">{formatINR(price)}</p>
      <p className="mt-1.5 text-caption text-ink-faint">
        {compareAt ? (
          <>
            <s className="tabular">{formatINR(compareAt)}</s> · {unit}
          </>
        ) : (
          unit
        )}
      </p>
    </div>
  );
}

export function AdventureCard({
  adventure,
  closure,
  whatsappNumber,
  priority = false,
}: {
  adventure: Adventure;
  /** `null` when bookable; the active closure — service, entity, or global — otherwise. */
  closure: Closure | null;
  whatsappNumber: string;
  priority?: boolean;
}) {
  const open = closure === null;
  const href =
    adventure.kind === "rafting" || adventure.kind === "bungee"
      ? `/${adventure.kind}/${adventure.slug}`
      : `/adventures/${adventure.slug}`;
  const product: EnquiryProduct = {
    kind: adventure.kind,
    slug: adventure.slug,
    name: adventure.name,
    priceInr: adventure.priceInr,
    priceUnit: "per person",
  };

  return (
    <Card interactive className="flex flex-col">
      <CardLink closure={closure} href={href} className="block no-underline">
        <MediaFrame
          media={adventure.coverMedia ?? null}
          ratio="card"
          standInSeed={adventure.slug}
          priority={priority}
          emptyLabel={`${adventure.name} — photograph pending`}
        >
          {!open && <div className="absolute inset-0 bg-granite-950/55" aria-hidden />}
          <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-2 p-3">
            {adventure.grade && <GradeChip grade={adventure.grade} size="sm" onMedia />}
            <Chip tone="onMedia" size="sm" icon={<Clock />}>
              {formatDurationShort(adventure.durationMinutes)}
            </Chip>
          </div>
          {!open && (
            <div className="absolute inset-0 grid place-items-center px-4">
              <AvailabilityPill open={false} label="Paused for monsoon" onMedia />
            </div>
          )}
          <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 p-3">
            {adventure.bestFor && (
              <Chip tone="onMedia" size="sm">
                {adventure.bestFor}
              </Chip>
            )}
            {adventure.rating !== null && (
              <span className="rounded-full bg-canvas px-2.5 py-1 shadow-sm">
                <Rating value={adventure.rating} size="sm" />
              </span>
            )}
          </div>
        </MediaFrame>
      </CardLink>

      <CardBody className="flex flex-1 flex-col gap-4">
        <div className="flex-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="min-w-0 flex-1 text-title text-ink">
              <CardLink closure={closure} href={href} className="text-ink no-underline hover:underline">
                {adventure.name}
              </CardLink>
            </h3>
            <div className="flex shrink-0 items-center gap-2">
              {adventure.badge && (
                <Chip tone="ember" size="sm" className="mt-0.5">
                  {adventure.badge}
                </Chip>
              )}
              <CardLink
                closure={closure}
                href={href}
                className="mt-1 whitespace-nowrap text-caption font-semibold text-link no-underline hover:underline"
              >
                Details
              </CardLink>
            </div>
          </div>
          <p className="mt-1.5 text-small text-ink-muted">{adventure.summary}</p>
        </div>

        <StatRow
          items={[
            adventure.kind === "rafting"
              ? {
                  label: "Distance",
                  value: formatKm(adventure.distanceKm),
                  icon: <Route />,
                }
              : adventure.kind === "bungee" || adventure.heightM
                ? {
                    label: "Height",
                    value: `${adventure.heightM} m`,
                    icon: <Mountain />,
                  }
                : {
                    label: "Where",
                    value: adventure.putInPoint ?? "Rishikesh",
                    icon: <Route />,
                  },
            {
              // Short form here: "2 hr 30 min" wraps inside a stat cell and
              // knocks the whole row out of alignment across a card grid.
              label: "Duration",
              value: formatDurationShort(adventure.durationMinutes),
              icon: <Clock />,
            },
            {
              label: "Min age",
              value: adventure.minAge ? `${adventure.minAge} yrs` : "—",
              icon: <Users />,
            },
          ]}
        />

        <div className="flex items-end justify-between gap-3">
          <PriceBlock
            price={adventure.priceInr}
            compareAt={adventure.compareAtPriceInr}
            unit="per person"
          />
          {open ? (
            <EnquireButton product={product} whatsappNumber={whatsappNumber} source="card" />
          ) : (
            <CardLink
              closure={closure}
              href={href}
              className="inline-flex h-11 items-center gap-2 rounded-md border border-granite-300 px-5 text-small font-semibold text-ink-muted no-underline"
            >
              Details <ArrowRight className="size-4" aria-hidden />
            </CardLink>
          )}
        </div>
      </CardBody>
    </Card>
  );
}

export function HotelCard({
  hotel,
  closure,
  whatsappNumber,
}: {
  hotel: Hotel;
  /** `null` when bookable; the active closure — service, entity, or global — otherwise. */
  closure: Closure | null;
  whatsappNumber: string;
}) {
  const open = closure === null;
  const href = `/hotels/${hotel.slug}`;
  const product: EnquiryProduct = {
    kind: "hotel",
    slug: hotel.slug,
    name: hotel.name,
    priceInr: hotel.pricePerNightInr,
    priceUnit: "per night",
  };

  return (
    <Card interactive className="flex flex-col">
      <CardLink closure={closure} href={href} className="block no-underline">
        <MediaFrame
          media={hotel.coverMedia ?? null}
          ratio="card"
          standInSeed={hotel.slug}
          emptyLabel={`${hotel.name} — photograph pending`}
        >
          {!open && <div className="absolute inset-0 bg-granite-950/55" aria-hidden />}
          <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-2 p-3">
            <Chip tone="onMedia" size="sm">
              {hotel.locality}
            </Chip>
            {hotel.starRating && (
              <Chip tone="onMedia" size="sm">
                {"★".repeat(hotel.starRating)}
              </Chip>
            )}
          </div>
          {!open && (
            <div className="absolute inset-0 grid place-items-center px-4">
              <AvailabilityPill open={false} onMedia />
            </div>
          )}
          <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 p-3">
            {hotel.badge && (
              <Chip tone="onMedia" size="sm">
                {hotel.badge}
              </Chip>
            )}
            {hotel.rating !== null && (
              <span className="rounded-full bg-canvas px-2.5 py-1 shadow-sm">
                <Rating value={hotel.rating} size="sm" />
              </span>
            )}
          </div>
        </MediaFrame>
      </CardLink>

      <CardBody className="flex flex-1 flex-col gap-4">
        <div className="flex-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-title text-ink">
              <CardLink closure={closure} href={href} className="text-ink no-underline hover:underline">
                {hotel.name}
              </CardLink>
            </h3>
            <CardLink
              closure={closure}
              href={href}
              className="mt-1 shrink-0 whitespace-nowrap text-caption font-semibold text-link no-underline hover:underline"
            >
              Details
            </CardLink>
          </div>
          <p className="mt-1.5 text-small text-ink-muted">{hotel.tagline}</p>
          <ul className="mt-3 flex flex-wrap gap-1.5">
            {hotel.amenities.slice(0, 4).map((a) => (
              <li key={a}>
                <Chip size="sm">{a}</Chip>
              </li>
            ))}
            {hotel.amenities.length > 4 && (
              <li>
                <Chip size="sm" tone="jade">
                  +{hotel.amenities.length - 4} more
                </Chip>
              </li>
            )}
          </ul>
        </div>

        <div className="flex items-end justify-between gap-3">
          <PriceBlock
            price={hotel.pricePerNightInr}
            compareAt={hotel.compareAtPriceInr}
            unit="per night"
          />
          {open ? (
            <EnquireButton product={product} whatsappNumber={whatsappNumber} source="card">
              Check dates <ArrowRight className="size-4" aria-hidden />
            </EnquireButton>
          ) : (
            <CardLink
              closure={closure}
              href={href}
              className="inline-flex h-11 items-center gap-2 rounded-md border border-granite-300 px-5 text-small font-semibold text-ink-muted no-underline"
            >
              Details <ArrowRight className="size-4" aria-hidden />
            </CardLink>
          )}
        </div>
      </CardBody>
    </Card>
  );
}
