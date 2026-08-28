import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * The surface everything sits on. Elevation is declared once: `raised` cards
 * carry a shadow and no border, `flat` cards carry a hairline and no shadow.
 * A 1px border under a wide soft shadow is the ghost card, so the two never mix.
 */
export function Card({
  className,
  elevation = "raised",
  interactive = false,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & {
  elevation?: "raised" | "flat" | "sunk";
  interactive?: boolean;
}) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-lg bg-canvas",
        elevation === "raised" && "shadow-md",
        elevation === "flat" && "border border-hairline",
        elevation === "sunk" && "bg-canvas-sunk",
        interactive &&
          "transition-[box-shadow,transform] duration-[--duration-base] " +
            "ease-[--ease-out-quart] hover:-translate-y-0.5 " +
            (elevation === "raised" ? "hover:shadow-lg" : "hover:border-granite-300"),
        className,
      )}
      {...props}
    />
  );
}

export function CardBody({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("p-5", className)} {...props} />;
}

/**
 * A section heading. Deliberately has no eyebrow or kicker slot — the heading
 * carries its own weight, and a label above it is the thing to delete.
 */
export function SectionHeading({
  title,
  description,
  align = "start",
  as: As = "h2",
  className,
  action,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  align?: "start" | "center";
  as?: "h1" | "h2" | "h3";
  className?: string;
  action?: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between",
        align === "center" && "sm:flex-col sm:items-center",
        className,
      )}
    >
      <div className={cn(align === "center" && "text-center")}>
        <As className="text-display-md text-ink">{title}</As>
        {description && (
          <p
            className={cn(
              "mt-3 text-ink-muted measure",
              align === "center" && "mx-auto",
            )}
          >
            {description}
          </p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

/** The km / duration stat row from the product cards. */
export function StatRow({
  items,
  className,
}: {
  items: { label: string; value: React.ReactNode; icon?: React.ReactNode }[];
  className?: string;
}) {
  return (
    <dl
      className={cn(
        "grid divide-x divide-hairline rounded-md bg-canvas-sunk",
        className,
      )}
      style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}
    >
      {items.map((item) => (
        <div key={item.label} className="px-3 py-2.5 text-center">
          <dd className="tabular text-subtitle whitespace-nowrap text-ink">
            <span className="inline-flex items-center gap-1.5">
              {item.icon && (
                <span className="text-ink-faint [&>svg]:size-4" aria-hidden>
                  {item.icon}
                </span>
              )}
              {item.value}
            </span>
          </dd>
          <dt className="mt-0.5 text-caption text-ink-faint">{item.label}</dt>
        </div>
      ))}
    </dl>
  );
}
