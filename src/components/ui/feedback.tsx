import * as React from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * A rating, stated as a number first. Stars are the decoration; the figure and
 * the count are the information, and the whole thing reads correctly to a
 * screen reader as one sentence.
 */
export function Rating({
  value,
  count,
  size = "md",
  className,
}: {
  value: number | string | null | undefined;
  count?: number | null;
  size?: "sm" | "md";
  className?: string;
}) {
  const n = typeof value === "string" ? Number(value) : value;
  if (n === null || n === undefined || Number.isNaN(n)) return null;
  const rounded = Math.round(n * 10) / 10;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 font-semibold",
        size === "sm" ? "text-caption" : "text-small",
        className,
      )}
    >
      <Star
        className={cn(
          "shrink-0 fill-current text-star",
          size === "sm" ? "size-3" : "size-3.5",
        )}
        aria-hidden
      />
      <span className="tabular">{rounded.toFixed(1)}</span>
      {typeof count === "number" && count > 0 && (
        <span className="font-normal text-ink-faint tabular">({count})</span>
      )}
      <span className="sr-only">
        Rated {rounded.toFixed(1)} out of 5
        {typeof count === "number" && count > 0
          ? ` from ${count} review${count === 1 ? "" : "s"}`
          : ""}
      </span>
    </span>
  );
}

/**
 * Availability, the loudest state in the system. Carries a dot, a word and a
 * colour — never colour alone.
 */
export function AvailabilityPill({
  open,
  label,
  onMedia = false,
  className,
}: {
  open: boolean;
  label?: string;
  /**
   * Set when the pill sits on a scrimmed photograph. The dark closed fill has
   * no figure-ground against a scrim — it reads as dark-on-dark and the
   * loudest state in the system becomes the quietest thing on the card — so on
   * media the pill inverts to a light fill and keeps its colour in the text.
   */
  onMedia?: boolean;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full px-3 py-1 text-small font-semibold",
        // Filled, not tinted: availability outranks every other chip on a card.
        onMedia
          ? cn("bg-canvas shadow-md", open ? "text-open" : "text-closed")
          : open
            ? "bg-open text-white"
            : "bg-closed text-white",
        className,
      )}
    >
      <span
        className={cn(
          "size-2 shrink-0 rounded-full",
          onMedia
            ? open
              ? "bg-open"
              : "bg-closed"
            : open
              ? "bg-jade-300"
              : "bg-granite-400",
        )}
        aria-hidden
      />
      {label ?? (open ? "Running today" : "Bookings closed")}
    </span>
  );
}

export function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      aria-hidden
      className={cn(
        "rounded-md bg-granite-100",
        "bg-[linear-gradient(90deg,var(--color-granite-100)_25%,var(--color-granite-200)_50%,var(--color-granite-100)_75%)]",
        "bg-[length:200%_100%] animate-[shimmer_1.4s_linear_infinite]",
        className,
      )}
      {...props}
    />
  );
}

/**
 * An empty state that says what is missing and what to do about it. A blank
 * panel with a shrug is a bug the client will phone about.
 */
export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center rounded-lg border border-dashed border-granite-300 px-6 py-14 text-center",
        className,
      )}
    >
      {icon && (
        <span className="mb-4 grid size-12 place-items-center rounded-full bg-granite-100 text-ink-faint [&>svg]:size-6">
          {icon}
        </span>
      )}
      <p className="text-subtitle text-ink">{title}</p>
      {description && (
        <p className="mt-1.5 max-w-sm text-small text-ink-muted">{description}</p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
