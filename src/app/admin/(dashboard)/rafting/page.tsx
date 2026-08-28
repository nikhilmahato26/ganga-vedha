import type { Metadata } from "next";
import { listAdventuresAdmin } from "@/lib/admin-data";
import { AdventureList } from "@/components/admin/adventure-list";

export const metadata: Metadata = { title: "Rafting", robots: { index: false, follow: false } };

export default async function RaftingAdminPage() {
  const items = await listAdventuresAdmin("rafting");
  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="text-display-md text-ink">Rafting stretches</h1>
      <p className="mt-2 text-ink-muted">Sold by the kilometre. Order here sets the order on the site.</p>
      <div className="mt-8">
        <AdventureList kind="rafting" items={items} />
      </div>
    </div>
  );
}
