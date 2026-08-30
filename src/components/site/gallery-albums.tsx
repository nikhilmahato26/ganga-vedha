"use client";

import * as React from "react";
import { MediaFrame } from "@/components/ui";
import { cn } from "@/lib/utils";
import type { GalleryItem } from "@/lib/content";

/**
 * The full /gallery page. Photos are grouped by their free-text `album`
 * ("Rafting", "Mountains", "Manali"…); anything without one falls under
 * "More". A pill row filters to a single album.
 */
export function GalleryAlbums({ items }: { items: GalleryItem[] }) {
  const albums = React.useMemo(() => {
    const set = new Set<string>();
    for (const i of items) if (i.album) set.add(i.album);
    return [...set].sort();
  }, [items]);

  const hasUnfiled = items.some((i) => !i.album);
  const [filter, setFilter] = React.useState<string>("all");

  const filtered =
    filter === "all"
      ? items
      : filter === "__more"
        ? items.filter((i) => !i.album)
        : items.filter((i) => i.album === filter);

  return (
    <div>
      {(albums.length > 0 || hasUnfiled) && (
        <div
          className="flex flex-wrap gap-2"
          role="group"
          aria-label="Filter gallery by album"
        >
          <Pill active={filter === "all"} onClick={() => setFilter("all")}>
            All
          </Pill>
          {albums.map((a) => (
            <Pill key={a} active={filter === a} onClick={() => setFilter(a)}>
              {a}
            </Pill>
          ))}
          {hasUnfiled && (
            <Pill active={filter === "__more"} onClick={() => setFilter("__more")}>
              More
            </Pill>
          )}
        </div>
      )}

      <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {filtered.map((item) => (
          <figure key={item.id} className="m-0">
            <MediaFrame
              media={item.media}
              ratio="square"
              standInSeed={String(item.id)}
              scrim={false}
              className="rounded-lg"
              emptyLabel={item.caption ?? "Gallery photo"}
            />
            {item.caption && (
              <figcaption className="mt-1.5 text-caption text-ink-faint">
                {item.caption}
              </figcaption>
            )}
          </figure>
        ))}
      </div>
    </div>
  );
}

function Pill({
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
