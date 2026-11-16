import type { Metadata } from "@/components/seo";
import { Alert, Breadcrumb, EmptyState, SectionHeading } from "@/components/ui";
import { BedDouble } from "lucide-react";
import { HotelCard } from "@/components/site/product-card";
import { getClosures, getHotels, getSiteSettings } from "@/lib/content";
import { resolveClosure } from "@/lib/closure";
import { useLoaderData } from "react-router-dom";
import { NearbyPlaces } from "@/components/site/nearby-places";

// 60s: matches the hotels cache window in @/lib/content.
const metadata: Metadata = {
  title: "Hotels in Tapovan, Rishikesh — near Laxman Jhula",
  description:
    "Budget and family rooms at Ganga Veda Hotels & Resorts in Tapovan, Rishikesh, close to Laxman Jhula, Ram Jhula and Tapovan Market — and a stay in Haridwar. Book direct on WhatsApp.",
  alternates: { canonical: "/hotels" },
};

export async function loader() {
  const [hotels, settings, closures] = await Promise.all([
    getHotels(),
    getSiteSettings(),
    getClosures(),
  ]);
  return { hotels, settings, closures, metadata };
}

export default function HotelsIndex() {
  const { hotels, settings, closures } = useLoaderData<typeof loader>();
  const closure = resolveClosure(closures, { service: "hotel" });

  return (
    <div className="container-page pt-6 pb-8">
      <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "Stays" }]} />
      <div className="pt-8">
        <SectionHeading
          as="h1"
          title="Hotels in Tapovan, Rishikesh"
          description="Affordable, comfortable rooms at Ganga Veda Hotels & Resorts in Tapovan — a short walk from Laxman Jhula — and a stay in Haridwar. Add rafting or bungee to any booking."
        />
      </div>

      {closure && (
        <Alert tone="closed" title={closure.title} className="mt-8">
          {closure.body}
          {closure.footnote ? ` ${closure.footnote}.` : ""}
        </Alert>
      )}
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
              closure={resolveClosure(closures, {
                service: "hotel",
                entityType: "hotel",
                entityId: h.id,
              })}
              whatsappNumber={settings.whatsappNumber}
            />
          ))}
        </div>
      )}

      <NearbyPlaces className="mt-12" />
    </div>
  );
}
