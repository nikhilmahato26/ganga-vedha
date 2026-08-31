import { ArrowRight } from "lucide-react";
import { Card, LinkButton, MediaFrame, Rating } from "@/components/ui";
import { EnquireButton, type EnquiryProduct } from "./enquiry";
import { CardLink } from "./product-card";
import { ClosureTrigger } from "./chrome";
import { formatINR } from "@/lib/format";
import type { Adventure, Closure } from "@/lib/content";

/**
 * The wide, landscape bungee card from the reference: square photo on the
 * left, operator/kind label + rating, title, struck-through and live price,
 * and Book / Details actions on the right. Used in the operator rows on the
 * home page and /adventures.
 */
export function BungeeCard({
  adventure,
  closure,
  whatsappNumber,
}: {
  adventure: Adventure;
  closure: Closure | null;
  whatsappNumber: string;
}) {
  const open = closure === null;
  const href = `/bungee/${adventure.slug}`;
  const product: EnquiryProduct = {
    kind: "bungee",
    slug: adventure.slug,
    name: adventure.name,
    priceInr: adventure.priceInr,
    priceUnit: "per person",
  };
  const discount =
    adventure.compareAtPriceInr && adventure.compareAtPriceInr > adventure.priceInr
      ? Math.round((1 - adventure.priceInr / adventure.compareAtPriceInr) * 100)
      : null;

  return (
    <Card elevation="flat" className="overflow-hidden">
      <div className="grid grid-cols-[8rem_1fr] sm:grid-cols-[12rem_1fr]">
        <CardLink closure={closure} href={href} className="relative block no-underline">
          <MediaFrame
            media={adventure.coverMedia ?? null}
            ratio="square"
            standInSeed={adventure.slug}
            scrim={false}
            className="h-full sm:aspect-auto"
            emptyLabel={`${adventure.name} — photograph pending`}
          />
          {discount !== null && (
            <span className="absolute bottom-2.5 left-2.5 rounded-full bg-canvas px-2.5 py-1 text-caption font-semibold text-cta shadow-sm">
              {discount}% OFF
            </span>
          )}
        </CardLink>

        <div className="flex min-w-0 flex-col gap-2 p-4 sm:p-6">
          <div className="flex items-start justify-between gap-3">
            <p className="text-caption font-semibold uppercase tracking-wide text-cta">
              Bungee{adventure.brand ? ` · ${adventure.brand}` : ""}
            </p>
            {adventure.rating !== null && (
              <Rating value={adventure.rating} count={adventure.reviewCount} size="sm" />
            )}
          </div>

          <h4 className="text-subtitle text-ink">
            <CardLink closure={closure} href={href} className="text-ink no-underline hover:underline">
              {adventure.name}
            </CardLink>
          </h4>

          <p className="mt-auto flex flex-wrap items-baseline gap-x-2 gap-y-0.5 pt-2">
            {adventure.compareAtPriceInr ? (
              <>
                <span className="text-small text-ink-faint">from</span>
                <s className="tabular text-small text-ink-faint">
                  {formatINR(adventure.compareAtPriceInr)}
                </s>
                <span className="tabular text-title font-semibold text-cta">
                  {formatINR(adventure.priceInr)}
                </span>
              </>
            ) : (
              <>
                <span className="tabular text-title font-semibold text-cta">
                  {formatINR(adventure.priceInr)}
                </span>
                <span className="text-small text-ink-faint">per person</span>
              </>
            )}
          </p>

          <div className="mt-3 flex flex-wrap gap-2.5">
            {open ? (
              <EnquireButton
                product={product}
                whatsappNumber={whatsappNumber}
                source="card"
                variant="outline"
              >
                Book now
              </EnquireButton>
            ) : (
              closure && (
                <ClosureTrigger
                  closure={closure}
                  className="inline-flex h-11 items-center rounded-md border border-granite-300 px-4 text-small font-semibold text-ink-muted"
                >
                  Bookings closed
                </ClosureTrigger>
              )
            )}
            <LinkButton href={href}>
              Show details <ArrowRight className="size-4" aria-hidden />
            </LinkButton>
          </div>
        </div>
      </div>
    </Card>
  );
}
