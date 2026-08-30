import type { Metadata } from "next";
import { listDestinationsAdmin } from "@/lib/admin-data";
import { DestinationList } from "@/components/admin/destination-list";

export const metadata: Metadata = {
  title: "Destinations",
  robots: { index: false, follow: false },
};

export default async function DestinationsAdminPage() {
  const items = await listDestinationsAdmin();
  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="text-display-md text-ink">Destinations</h1>
      <p className="mt-2 text-ink-muted">
        The places on the Stays page. Each stay and package can be tied to one, and shows on its page.
      </p>
      <div className="mt-8">
        <DestinationList items={items} />
      </div>
    </div>
  );
}
