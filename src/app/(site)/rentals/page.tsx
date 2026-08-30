import type { Metadata } from "next";
import { Car } from "lucide-react";
import { Breadcrumb, EmptyState, SectionHeading } from "@/components/ui";
import { RentalCard } from "@/components/site/catalog-cards";
import { getRentals, getSiteSettings } from "@/lib/content";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Car & bike rental in Rishikesh",
  description:
    "Cars with a driver, priced per route on a custom quote, and geared bikes and scooters at ₹600 a day. Documents, deposit and pickup details up front.",
  alternates: { canonical: "/rentals" },
};

export default async function RentalsIndex() {
  const [rentals, settings] = await Promise.all([getRentals(), getSiteSettings()]);

  return (
    <div className="container-page pt-6 pb-8">
      <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "Rentals" }]} />

      <div className="pt-8">
        <SectionHeading
          as="h1"
          title="Car & bike rental"
          description="A car comes with a driver and is priced per route — send us your itinerary and we'll quote a fixed figure that includes fuel, tolls and the driver's allowance. Bikes and scooters are a flat daily rate from our Tapovan office."
        />
      </div>

      {rentals.length === 0 ? (
        <EmptyState
          className="mt-12"
          icon={<Car />}
          title="No rentals listed yet"
          description="Vehicles added from the admin panel appear here the moment they are published."
        />
      ) : (
        <div className="mt-12 grid gap-6 sm:grid-cols-2">
          {rentals.map((r) => (
            <RentalCard key={r.id} rental={r} whatsappNumber={settings.whatsappNumber} />
          ))}
        </div>
      )}
    </div>
  );
}
