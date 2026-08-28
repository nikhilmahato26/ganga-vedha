import type { Metadata } from "next";
import { Breadcrumb, EmptyState, SectionHeading } from "@/components/ui";
import { BedDouble } from "lucide-react";
import { HotelCard } from "@/components/site/product-card";
import { getClosures, getHotels, getSiteSettings } from "@/lib/content";
import { isBookable } from "@/lib/closure";

// 60s: matches the hotels cache window in @/lib/content.
export const revalidate = 60;

export const metadata: Metadata = {
  title: "Stays in Rishikesh",
  description:
    "Riverside camps and guesthouses in Tapovan and Byasi, a short shuttle from the rafting put-in.",
  alternates: { canonical: "/hotels" },
};

export default async function HotelsIndex() {
  const [hotels, settings, closures] = await Promise.all([
    getHotels(),
    getSiteSettings(),
    getClosures(),
  ]);

  return (
    <div className="container-page pt-6 pb-8">
      <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "Stays" }]} />
      <div className="pt-8">
        <SectionHeading
          as="h1"
          title="Where to stay"
          description="Camps on the sand at Byasi and rooms in Tapovan. Both are a short shuttle from the put-in, and both can be bundled with any rafting stretch."
        />
      </div>

      {hotels.length === 0 ? (
        <EmptyState
          className="mt-12"
          icon={<BedDouble />}
          title="No stays listed yet"
          description="Properties added from the admin panel appear here the moment they are published."
        />
      ) : (
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {hotels.map((h) => (
            <HotelCard
              key={h.id}
              hotel={h}
              open={isBookable(closures, {
                service: "hotel",
                entityType: "hotel",
                entityId: h.id,
              })}
              whatsappNumber={settings.whatsappNumber}
            />
          ))}
        </div>
      )}
    </div>
  );
}
