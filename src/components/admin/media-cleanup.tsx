"use client";

import * as React from "react";
import Image from "next/image";
import { ImagePlus, Trash2 } from "lucide-react";
import { Button, EmptyState, useToast } from "@/components/ui";
import { deleteMedia } from "@/app/actions/media";

export type UnusedMediaItem = {
  id: number;
  publicId: string;
  secureUrl: string;
  width: number | null;
  height: number | null;
  bytes: number | null;
  folder: string | null;
};

function formatBytes(n: number | null): string {
  if (!n) return "—";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Photos an upload attempt left behind — a form abandoned mid-edit, a cover
 * photo swapped for another. Nothing links to them, so they cost Cloudinary
 * storage for no reason. This is the tool that replaces the raw SQL cleanup
 * done by hand three times while building this project.
 */
export function MediaCleanup({ items }: { items: UnusedMediaItem[] }) {
  const { toast } = useToast();
  const [rows, setRows] = React.useState(items);
  const [selected, setSelected] = React.useState<Set<number>>(new Set());
  const [deleting, setDeleting] = React.useState(false);

  function toggle(id: number) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    setSelected((prev) => (prev.size === rows.length ? new Set() : new Set(rows.map((r) => r.id))));
  }

  async function deleteSelected() {
    if (selected.size === 0) return;
    if (!confirm(`Permanently delete ${selected.size} photo${selected.size === 1 ? "" : "s"}? This can't be undone.`)) {
      return;
    }
    setDeleting(true);
    const ids = [...selected];
    for (const id of ids) {
      await deleteMedia(id);
    }
    setRows((prev) => prev.filter((r) => !selected.has(r.id)));
    setSelected(new Set());
    setDeleting(false);
    toast({ tone: "success", title: `Deleted ${ids.length} photo${ids.length === 1 ? "" : "s"}` });
  }

  const totalBytes = rows.reduce((sum, r) => sum + (r.bytes ?? 0), 0);

  if (rows.length === 0) {
    return (
      <EmptyState
        icon={<ImagePlus />}
        title="Nothing to clean up"
        description="Every uploaded photo is currently used somewhere on the site."
      />
    );
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-md bg-canvas-sunk p-4">
        <label className="flex items-center gap-2.5 text-small font-semibold text-ink">
          <input
            type="checkbox"
            checked={selected.size === rows.length}
            onChange={toggleAll}
            className="size-4 rounded-[4px] border-2 border-granite-300"
          />
          {selected.size > 0 ? `${selected.size} selected` : `${rows.length} unused photo${rows.length === 1 ? "" : "s"}`}
          <span className="font-normal text-ink-faint">· {formatBytes(totalBytes)} total</span>
        </label>
        <Button
          variant="danger"
          size="sm"
          onClick={deleteSelected}
          disabled={selected.size === 0}
          loading={deleting}
          loadingLabel="Deleting"
        >
          <Trash2 className="size-4" aria-hidden /> Delete selected
        </Button>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {rows.map((r) => (
          <label
            key={r.id}
            className="group relative block cursor-pointer overflow-hidden rounded-md border border-hairline"
          >
            <input
              type="checkbox"
              checked={selected.has(r.id)}
              onChange={() => toggle(r.id)}
              className="absolute top-2 left-2 z-(--z-raised) size-5 rounded-[4px] border-2 border-white bg-white/80"
            />
            <div className="relative aspect-square bg-canvas-sunk">
              <Image src={r.secureUrl} alt="" fill sizes="200px" className="object-cover" />
            </div>
            <div className="bg-canvas p-2">
              <p className="truncate text-caption font-semibold text-ink">{r.folder ?? "—"}</p>
              <p className="text-micro text-ink-faint">
                {r.width && r.height ? `${r.width}×${r.height}` : "—"} · {formatBytes(r.bytes)}
              </p>
            </div>
          </label>
        ))}
      </div>
    </div>
  );
}
