"use client";

import * as React from "react";
import { MediaFrame, SectionHeading } from "@/components/ui";
import { cn } from "@/lib/utils";
import type { GalleryItem, ServiceKey } from "@/lib/content";

const CATEGORY_LABEL: Record<ServiceKey, string> = {
  rafting: "Rafting",
  bungee: "Bungee",
  hotel: "Hotels",
};

/**
 * Hidden entirely until the owner has actually added photos — an empty
 * filtered grid on a landing page reads as broken, not as "coming soon".
 */
export function GallerySection({ items }: { items: GalleryItem[] }) {
  const [filter, setFilter] = React.useState<ServiceKey | "all">("all");

  const availableCategories = React.useMemo(() => {
    const present = new Set(items.map((i) => i.category).filter((c): c is ServiceKey => c !== null));
    return (["rafting", "bungee", "hotel"] as const).filter((k) => present.has(k));
  }, [items]);

  if (items.length === 0) return null;

  const filtered = filter === "all" ? items : items.filter((i) => i.category === filter);

  return (
    <section id="gallery" className="container-page scroll-mt-28 pt-24">
      <SectionHeading
        as="h2"
        title="Gallery"
        description="What the river, the platform and the stays actually look like."
      />

      {availableCategories.length > 0 && (
        <div className="mt-6 flex flex-wrap gap-2" role="group" aria-label="Filter gallery by category">
          <FilterPill active={filter === "all"} onClick={() => setFilter("all")}>
            All
          </FilterPill>
          {availableCategories.map((cat) => (
            <FilterPill key={cat} active={filter === cat} onClick={() => setFilter(cat)}>
              {CATEGORY_LABEL[cat]}
            </FilterPill>
          ))}
        </div>
      )}

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {filtered.map((item) => (
          <MediaFrame
            key={item.id}
            media={item.media}
            ratio="square"
            standInSeed={String(item.id)}
            scrim={false}
            className="rounded-lg"
            emptyLabel={item.caption ?? "Gallery photo"}
          />
        ))}
      </div>
    </section>
  );
}

function FilterPill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "inline-flex h-9 items-center rounded-full border px-4 text-small font-semibold transition-colors",
        active
          ? "border-jade-700 bg-jade-700 text-white"
          : "border-granite-300 bg-canvas text-ink-muted hover:border-granite-400 hover:text-ink",
      )}
    >
      {children}
    </button>
  );
}
