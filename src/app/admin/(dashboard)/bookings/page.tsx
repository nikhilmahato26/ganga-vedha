import type { Metadata } from "next";
import { listEnquiriesAdmin } from "@/lib/admin-data";
import { BookingInbox } from "@/components/admin/booking-inbox";

export const metadata: Metadata = { title: "Bookings", robots: { index: false, follow: false } };

export default async function BookingsAdminPage() {
  const items = await listEnquiriesAdmin();
  return (
    <div className="mx-auto max-w-6xl">
      <h1 className="text-display-md text-ink">Bookings</h1>
      <p className="mt-2 text-ink-muted">
        Every enquiry that came in through the site, newest first. Reply on WhatsApp with one tap.
      </p>
      <div className="mt-8">
        <BookingInbox items={items} />
      </div>
    </div>
  );
}
