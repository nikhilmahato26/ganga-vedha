import type { Metadata } from "next";
import { listRentalsAdmin } from "@/lib/admin-data";
import { RentalList } from "@/components/admin/rental-list";

export const metadata: Metadata = { title: "Rentals", robots: { index: false, follow: false } };

export default async function RentalsAdminPage() {
  const items = await listRentalsAdmin();
  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="text-display-md text-ink">Car &amp; bike rental</h1>
      <p className="mt-2 text-ink-muted">
        A car is usually quote-only; a bike carries a daily rate. Order here sets the order on the site.
      </p>
      <div className="mt-8">
        <RentalList items={items} />
      </div>
    </div>
  );
}
