import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Card, MediaFrame } from "@/components/ui";
import type { Promotion } from "@/lib/content";

function CtaLink({ label, href }: { label: string; href: string }) {
  const external = /^https?:\/\//i.test(href);
  const className =
    "mt-2 inline-flex items-center gap-1.5 text-caption font-semibold text-link no-underline hover:underline";
  return external ? (
    <a href={href} target="_blank" rel="noopener" className={className}>
      {label} <ArrowRight className="size-3.5" aria-hidden />
    </a>
  ) : (
    <Link href={href} className={className}>
      {label} <ArrowRight className="size-3.5" aria-hidden />
    </Link>
  );
}

/**
 * The owner's small promo cards, in a strip under the hero. Hidden entirely
 * when there are none active — an empty band reads as broken, not as
 * "nothing on offer".
 */
export function PromoStrip({ promotions }: { promotions: Promotion[] }) {
  if (promotions.length === 0) return null;

  return (
    <section
      className="container-page pt-10"
      aria-label="Offers and announcements"
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {promotions.map((p) => (
          <Card key={p.id} elevation="flat" className="flex gap-4 p-4">
            {p.media && (
              <MediaFrame
                media={p.media}
                ratio="square"
                standInSeed={`promo-${p.id}`}
                scrim={false}
                className="size-16 shrink-0 rounded-md"
                emptyLabel=""
              />
            )}
            <div className="min-w-0 flex-1">
              <p className="text-small font-semibold text-ink">{p.title}</p>
              {p.body && <p className="mt-0.5 text-caption text-ink-muted">{p.body}</p>}
              {p.ctaLabel && p.ctaHref && <CtaLink label={p.ctaLabel} href={p.ctaHref} />}
            </div>
          </Card>
        ))}
      </div>
    </section>
  );
}
