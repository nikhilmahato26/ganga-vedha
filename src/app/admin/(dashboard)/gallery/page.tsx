import type { Metadata } from "next";
import { listGalleryItemsAdmin } from "@/lib/admin-data";
import { GalleryManager, type GalleryItemRow } from "@/components/admin/gallery-manager";

export const metadata: Metadata = { title: "Gallery", robots: { index: false, follow: false } };

export default async function GalleryAdminPage() {
  const rows = await listGalleryItemsAdmin();
  const items: GalleryItemRow[] = rows.map((r) => ({
    id: r.item.id,
    category: r.item.category,
    caption: r.item.caption,
    isPublished: r.item.isPublished,
    media: { id: r.media.id, secureUrl: r.media.secureUrl, altText: r.media.altText ?? "" },
  }));

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="text-display-md text-ink">Gallery</h1>
      <p className="mt-2 text-ink-muted">
        The photo gallery on the homepage. Visitors can filter it by Rafting, Bungee, or Hotels — tag each
        photo with the category it belongs to, or leave it general.
      </p>
      <div className="mt-8">
        <GalleryManager items={items} />
      </div>
    </div>
  );
}
