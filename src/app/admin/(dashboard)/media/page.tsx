import type { Metadata } from "next";
import { listUnusedMedia } from "@/lib/admin-data";
import { MediaCleanup } from "@/components/admin/media-cleanup";

export const metadata: Metadata = { title: "Media", robots: { index: false, follow: false } };

export default async function MediaAdminPage() {
  const items = await listUnusedMedia();
  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="text-display-md text-ink">Media</h1>
      <p className="mt-2 text-ink-muted">
        Photos that were uploaded but aren&rsquo;t used anywhere on the site anymore — an
        abandoned form, a cover photo that got swapped out. Safe to delete.
      </p>
      <div className="mt-8">
        <MediaCleanup items={items} />
      </div>
    </div>
  );
}
