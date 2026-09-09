import { Check, Minus } from "lucide-react";
import { Card, CardBody } from "@/components/ui";
import { cn } from "@/lib/utils";

/** The stat strip every detail page opens with. */
export function SpecGrid({
  items,
  className,
}: {
  items: { label: string; value: string }[];
  className?: string;
}) {
  return (
    <dl
      className={cn(
        "grid grid-cols-2 gap-px overflow-hidden rounded-lg bg-hairline sm:grid-cols-4",
        className,
      )}
    >
      {items.map((i) => (
        <div key={i.label} className="bg-canvas px-4 py-4">
          <dt className="text-caption text-ink-faint">{i.label}</dt>
          <dd className="mt-1 tabular text-subtitle text-ink">{i.value}</dd>
        </div>
      ))}
    </dl>
  );
}

/**
 * Pulls the "Free …" lines out of an inclusions list so the giveaways —
 * the DSLR video, the pickup and drop — get read before the tab is opened.
 * Data-driven on purpose: whatever the owner types in the admin inclusions
 * field starting with "Free" surfaces here, and nothing is hard-coded that
 * could go stale against the list below it.
 */
export function freePerks(inclusions: string[]): string[] {
  return inclusions.filter((i) => /^free\b/i.test(i.trim()));
}

/** The perk strip. Renders nothing when there are no "Free …" inclusions. */
export function FreePerks({
  inclusions,
  className,
}: {
  inclusions: string[];
  className?: string;
}) {
  const perks = freePerks(inclusions);
  if (perks.length === 0) return null;
  return (
    <ul
      className={cn(
        "flex flex-wrap gap-x-6 gap-y-2 rounded-lg border border-jade-200 bg-jade-50 px-4 py-3",
        className,
      )}
    >
      {perks.map((p) => (
        <li key={p} className="flex items-start gap-2 text-small font-medium text-jade-900">
          <Check className="mt-0.5 size-4 shrink-0 text-open" aria-hidden />
          {p}
        </li>
      ))}
    </ul>
  );
}

export function IncludedList({
  inclusions,
  exclusions,
}: {
  inclusions: string[];
  exclusions: string[];
}) {
  return (
    <div className="grid gap-8 sm:grid-cols-2">
      <div>
        <h3 className="text-subtitle text-ink">What&rsquo;s included</h3>
        <ul className="mt-4 space-y-2.5">
          {inclusions.map((i) => (
            <li key={i} className="flex items-start gap-2.5 text-small text-ink-muted">
              <Check className="mt-0.5 size-4 shrink-0 text-open" aria-hidden />
              {i}
            </li>
          ))}
        </ul>
      </div>
      <div>
        <h3 className="text-subtitle text-ink">Not included</h3>
        <ul className="mt-4 space-y-2.5">
          {exclusions.map((i) => (
            <li key={i} className="flex items-start gap-2.5 text-small text-ink-muted">
              <Minus className="mt-0.5 size-4 shrink-0 text-ink-faint" aria-hidden />
              {i}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

/** Desktop booking panel. On mobile the sticky bar takes over. */
export function BookingPanel({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Card className={cn("lg:sticky lg:top-28", className)}>
      <CardBody className="p-6">{children}</CardBody>
    </Card>
  );
}
