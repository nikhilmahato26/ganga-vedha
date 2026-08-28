"use client";

import * as React from "react";
import Image from "next/image";
import { Trash2 } from "lucide-react";
import { Card, CardBody, Field, Input, Select, Switch, useToast } from "@/components/ui";
import { ImageUploader } from "@/components/admin/uploader";
import { createGalleryItem, deleteGalleryItem, updateGalleryItem } from "@/app/actions/gallery";
import type { MediaItem } from "@/lib/media-types";

type ServiceKey = "hotel" | "rafting" | "bungee";

export type GalleryItemRow = {
  id: number;
  category: ServiceKey | null;
  caption: string | null;
  isPublished: boolean;
  media: { id: number; secureUrl: string; altText: string };
};

const CATEGORY_LABEL: Record<ServiceKey, string> = {
  rafting: "Rafting",
  bungee: "Bungee",
  hotel: "Hotels",
};

/**
 * No form, no submit button — each control saves itself the moment it
 * changes, the same way the closures list already works. An upload finishing
 * IS the "add"; there is nothing further to confirm.
 */
export function GalleryManager({ items }: { items: GalleryItemRow[] }) {
  const { toast } = useToast();
  const [rows, setRows] = React.useState(items);
  const [staging, setStaging] = React.useState<MediaItem[]>([]);
  // The uploader calls onChange once per photo as each one finishes, not once
  // for the whole batch — three photos means three overlapping calls, each
  // still awaiting the previous one's DB write. A ref set synchronously,
  // before any `await`, is what keeps two of those calls from both deciding
  // the same photo is "new" and creating it twice; React state updates alone
  // are too slow (async) to prevent that.
  const claimedRef = React.useRef(new Set<number>());

  async function handleUploadChange(next: MediaItem[]) {
    const added = next.filter((n) => !claimedRef.current.has(n.id));
    if (added.length === 0) {
      setStaging(next);
      return;
    }
    added.forEach((n) => claimedRef.current.add(n.id));
    // These are graduating into the list below — the drop zone goes back to
    // empty immediately rather than waiting on the DB round trip below.
    setStaging([]);
    for (const item of added) {
      const result = await createGalleryItem({
        mediaId: item.id,
        category: null,
        caption: null,
        isPublished: true,
      });
      if (result?.ok) {
        setRows((prev) => [...prev, { id: result.id, category: null, caption: null, isPublished: true, media: item }]);
      }
    }
    toast({ tone: "success", title: added.length > 1 ? `${added.length} photos added` : "Photo added" });
  }

  async function setCategory(id: number, value: ServiceKey | "") {
    const category = value === "" ? null : value;
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, category } : r)));
    await updateGalleryItem(id, { category });
  }

  function setCaptionLocal(id: number, caption: string) {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, caption } : r)));
  }

  async function saveCaption(id: number, caption: string) {
    await updateGalleryItem(id, { caption: caption.trim() || null });
  }

  async function togglePublished(id: number, isPublished: boolean) {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, isPublished } : r)));
    await updateGalleryItem(id, { isPublished });
  }

  async function remove(id: number) {
    if (!confirm("Delete this photo from the gallery? This can't be undone.")) return;
    setRows((prev) => prev.filter((r) => r.id !== id));
    await deleteGalleryItem(id);
    toast({ tone: "success", title: "Photo removed" });
  }

  return (
    <div className="space-y-6">
      <Card elevation="flat">
        <CardBody className="p-6">
          <h2 className="text-subtitle text-ink">Add photos</h2>
          <p className="mt-1.5 text-small text-ink-muted">
            Choose one or several — each is added to the gallery as soon as it finishes uploading.
            Pick a category and write a caption for each afterward.
          </p>
          <div className="mt-4">
            <ImageUploader folder="site" items={staging} onChange={handleUploadChange} max={30} />
          </div>
        </CardBody>
      </Card>

      {rows.length === 0 ? (
        <p className="rounded-md border border-dashed border-granite-300 px-4 py-10 text-center text-small text-ink-faint">
          No gallery photos yet.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map((row) => (
            <Card key={row.id} elevation="flat" className="overflow-hidden">
              <div className="relative aspect-[4/3] bg-canvas-sunk">
                <Image src={row.media.secureUrl} alt={row.caption ?? ""} fill sizes="360px" className="object-cover" />
                <button
                  type="button"
                  onClick={() => remove(row.id)}
                  className="absolute top-2 right-2 grid size-8 place-items-center rounded-full bg-granite-950/70 text-white transition-colors hover:bg-danger"
                >
                  <Trash2 className="size-4" aria-hidden />
                  <span className="sr-only">Delete</span>
                </button>
              </div>
              <CardBody className="space-y-3 p-4">
                <Field label="Category">
                  <Select
                    value={row.category ?? ""}
                    onChange={(e) => setCategory(row.id, e.target.value as ServiceKey | "")}
                  >
                    <option value="">General</option>
                    {(Object.keys(CATEGORY_LABEL) as ServiceKey[]).map((k) => (
                      <option key={k} value={k}>
                        {CATEGORY_LABEL[k]}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="Caption" hint="Optional">
                  <Input
                    value={row.caption ?? ""}
                    onChange={(e) => setCaptionLocal(row.id, e.target.value)}
                    onBlur={(e) => saveCaption(row.id, e.target.value)}
                    placeholder="e.g. Sunrise over Shivpuri"
                  />
                </Field>
                <div className="flex items-center justify-between pt-1">
                  <span className="text-small font-semibold text-ink">
                    {row.isPublished ? "Visible on site" : "Hidden"}
                  </span>
                  <Switch
                    label=""
                    checked={row.isPublished}
                    onChange={(e) => togglePublished(row.id, e.target.checked)}
                  />
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
