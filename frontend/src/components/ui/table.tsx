import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Wide tables scroll inside their own container; the page body never scrolls
 * sideways. The wrapper is focusable so a keyboard user can reach the scroll.
 */
export function TableScroller({
  className,
  label,
  children,
}: {
  className?: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div
      role="region"
      aria-label={label}
      tabIndex={0}
      className={cn(
        "w-full overflow-x-auto rounded-lg border border-hairline",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function Table({
  className,
  ...props
}: React.TableHTMLAttributes<HTMLTableElement>) {
  return (
    <table
      className={cn("w-full border-collapse text-left text-small", className)}
      {...props}
    />
  );
}

export function Th({
  className,
  ...props
}: React.ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      scope="col"
      className={cn(
        "sticky top-0 z-(--z-raised) bg-canvas-sunk px-4 py-3 font-semibold whitespace-nowrap text-ink-muted",
        className,
      )}
      {...props}
    />
  );
}

export function Td({
  className,
  ...props
}: React.TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td
      className={cn("border-t border-hairline px-4 py-3 align-middle", className)}
      {...props}
    />
  );
}

export function Tr({
  className,
  ...props
}: React.HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr className={cn("transition-colors hover:bg-canvas-sunk", className)} {...props} />
  );
}
