import type { Metadata } from "@/components/seo";
import { listGalleryItemsAdmin } from "@/lib/admin-data";
import { GalleryManager, type GalleryItemRow } from "@/components/admin/gallery-manager";
import { useLoaderData } from "react-router-dom";

const metadata: Metadata = { title: "Gallery", robots: { index: false, follow: false } };

export async function loader() {
  const rows = await listGalleryItemsAdmin();
  return { rows, metadata };
}

export default function GalleryAdminPage() {
  const { rows } = useLoaderData<typeof loader>();
  const items: GalleryItemRow[] = rows.map((r) => ({
    id: r.item.id,
    // The column is the wide service_key enum, but a gallery category is only
    // ever one of the three core services in the app.
    category: r.item.category as GalleryItemRow["category"],
    album: r.item.album,
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
