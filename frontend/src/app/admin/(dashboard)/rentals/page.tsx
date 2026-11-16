import type { Metadata } from "@/components/seo";
import { listRentalsAdmin } from "@/lib/admin-data";
import { RentalList } from "@/components/admin/rental-list";
import { useLoaderData } from "react-router-dom";

const metadata: Metadata = { title: "Rentals", robots: { index: false, follow: false } };

export async function loader() {
  const items = await listRentalsAdmin();
  return { items, metadata };
}

export default function RentalsAdminPage() {
  const { items } = useLoaderData<typeof loader>();
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
