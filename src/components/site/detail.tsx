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
