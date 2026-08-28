import * as React from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ChevronRight,
  CloudRain,
  Info,
  CircleCheck,
  XCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

const TONE = {
  info: { icon: Info, wrap: "bg-info-soft text-info", rule: "border-info/25" },
  success: { icon: CircleCheck, wrap: "bg-open-soft text-jade-800", rule: "border-jade-700/25" },
  caution: { icon: AlertTriangle, wrap: "bg-caution-soft text-caution", rule: "border-caution/25" },
  danger: { icon: XCircle, wrap: "bg-danger-soft text-danger", rule: "border-danger/25" },
  closed: { icon: CloudRain, wrap: "bg-granite-900 text-white", rule: "border-white/15" },
} as const;

/**
 * An inline banner. The river-status strap and a "this stretch is closed"
 * notice are not modals — they must be readable in place without interrupting
 * anyone, which is exactly the case a dialog is wrong for.
 */
export function Alert({
  tone = "info",
  title,
  children,
  action,
  className,
}: {
  tone?: keyof typeof TONE;
  title?: React.ReactNode;
  children?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  const { icon: Icon, wrap } = TONE[tone];
  return (
    <div
      role={tone === "danger" ? "alert" : "status"}
      className={cn(
        "flex flex-col gap-3 rounded-md p-4 sm:flex-row sm:items-center",
        wrap,
        className,
      )}
    >
      <Icon className="size-5 shrink-0" aria-hidden />
      <div className="min-w-0 flex-1">
        {title && <p className="text-small font-semibold">{title}</p>}
        {children && (
          <div className={cn("text-small", title && "mt-0.5 opacity-90")}>{children}</div>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

export function Breadcrumb({
  items,
  className,
}: {
  items: { label: string; href?: string }[];
  className?: string;
}) {
  return (
    <nav aria-label="Breadcrumb" className={className}>
      <ol className="flex flex-wrap items-center gap-1 text-small text-ink-muted">
        {items.map((item, i) => {
          const last = i === items.length - 1;
          return (
            <li key={item.label} className="inline-flex items-center gap-1">
              {item.href && !last ? (
                <Link
                  href={item.href}
                  className="rounded-[4px] px-1 py-0.5 no-underline hover:text-ink hover:underline"
                >
                  {item.label}
                </Link>
              ) : (
                <span className="px-1 py-0.5 font-semibold text-ink" aria-current={last ? "page" : undefined}>
                  {item.label}
                </span>
              )}
              {!last && (
                <ChevronRight className="size-3.5 shrink-0 text-granite-400" aria-hidden />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

/**
 * The mobile booking bar. Pinned, clears the home indicator via pb-safe, and
 * sits on the shared z-scale so it can never end up under the header.
 */
export function StickyActionBar({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "sticky-action-bar fixed inset-x-0 bottom-0 z-(--z-sticky) border-t border-hairline bg-canvas/95 px-4 pt-3 pb-safe backdrop-blur-sm lg:hidden",
        className,
      )}
    >
      <div className="flex items-center gap-3">{children}</div>
    </div>
  );
}
