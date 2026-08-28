import type { Metadata } from "next";
import { listHotelsAdmin } from "@/lib/admin-data";
import { HotelList } from "@/components/admin/hotel-list";

export const metadata: Metadata = { title: "Hotels", robots: { index: false, follow: false } };

export default async function HotelsAdminPage() {
  const items = await listHotelsAdmin();
  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="text-display-md text-ink">Hotels</h1>
      <p className="mt-2 text-ink-muted">Camps and guesthouses. Each one can have several room types.</p>
      <div className="mt-8">
        <HotelList items={items} />
      </div>
    </div>
  );
}
