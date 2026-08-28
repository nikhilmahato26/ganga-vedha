"use client";

import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Accordion built on <details>. The browser gives us the open state, keyboard
 * operation and in-page find-on-page expansion for free; a div-and-state
 * version loses all three.
 */
export function Accordion({
  items,
  className,
}: {
  items: { q: React.ReactNode; a: React.ReactNode }[];
  className?: string;
}) {
  return (
    <div className={cn("divide-y divide-hairline border-y border-hairline", className)}>
      {items.map((item, i) => (
        <details key={i} className="group">
          <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 py-4 text-subtitle text-ink [&::-webkit-details-marker]:hidden">
            {item.q}
            <ChevronDown
              className="size-5 shrink-0 text-ink-faint transition-transform duration-[--duration-fast] ease-[--ease-out-quart] group-open:rotate-180"
              aria-hidden
            />
          </summary>
          <div className="measure pb-5 text-ink-muted">{item.a}</div>
        </details>
      ))}
    </div>
  );
}

/** Tabs for a detail page: overview, inclusions, location, policies. */
export function Tabs({
  tabs,
  className,
}: {
  tabs: { id: string; label: string; content: React.ReactNode }[];
  className?: string;
}) {
  const [active, setActive] = React.useState(tabs[0]?.id);
  const refs = React.useRef<Record<string, HTMLButtonElement | null>>({});

  function onKeyDown(e: React.KeyboardEvent) {
    const i = tabs.findIndex((t) => t.id === active);
    let next = i;
    if (e.key === "ArrowRight") next = (i + 1) % tabs.length;
    else if (e.key === "ArrowLeft") next = (i - 1 + tabs.length) % tabs.length;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = tabs.length - 1;
    else return;
    e.preventDefault();
    setActive(tabs[next].id);
    refs.current[tabs[next].id]?.focus();
  }

  return (
    <div className={className}>
      <div
        role="tablist"
        onKeyDown={onKeyDown}
        className="rail scrollbar-none gap-1 border-b border-hairline"
      >
        {tabs.map((t) => (
          <button
            key={t.id}
            ref={(el) => {
              refs.current[t.id] = el;
            }}
            role="tab"
            type="button"
            id={`tab-${t.id}`}
            aria-selected={active === t.id}
            aria-controls={`panel-${t.id}`}
            tabIndex={active === t.id ? 0 : -1}
            onClick={() => setActive(t.id)}
            className={cn(
              "-mb-px min-h-11 border-b-2 px-4 text-small font-semibold whitespace-nowrap transition-colors",
              active === t.id
                ? "border-cta text-ink"
                : "border-transparent text-ink-muted hover:text-ink",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>
      {tabs.map((t) => (
        <div
          key={t.id}
          role="tabpanel"
          id={`panel-${t.id}`}
          aria-labelledby={`tab-${t.id}`}
          hidden={active !== t.id}
          tabIndex={0}
          className="pt-6"
        >
          {t.content}
        </div>
      ))}
    </div>
  );
}
