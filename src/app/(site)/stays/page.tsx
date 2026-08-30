import type { Metadata } from "next";
import { ArrowRight, BedDouble, MapPin } from "lucide-react";
import {
  Breadcrumb,
  Card,
  CardBody,
  EmptyState,
  LinkButton,
  SectionHeading,
} from "@/components/ui";
import { DestinationCard } from "@/components/site/catalog-cards";
import { getDestinations, getHotels } from "@/lib/content";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Stays & destinations across Uttarakhand and Himachal",
  description:
    "Haridwar, Rishikesh, Dehradun, Mussoorie, Tehri Lake, Nainital, Jim Corbett, Mukteshwar, Manali and Shimla — where to go, what each is best for, and where to stay.",
  alternates: { canonical: "/stays" },
};

export default async function StaysIndex() {
  const [destinations, hotels] = await Promise.all([getDestinations(), getHotels()]);

  const byRegion = new Map<string, typeof destinations>();
  for (const d of destinations) {
    const key = d.region ?? "Other";
    if (!byRegion.has(key)) byRegion.set(key, []);
    byRegion.get(key)!.push(d);
  }

  return (
    <div className="container-page pt-6 pb-8">
      <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "Stays" }]} />

      <div className="pt-8">
        <SectionHeading
          as="h1"
          title="Stays & destinations"
          description="The places we plan trips to across Uttarakhand and Himachal — each one with a short introduction, what it is best for, and the stays and packages that reach it."
        />
      </div>

      {/* Direct link to the bookable properties list. */}
      {hotels.length > 0 && (
        <Card elevation="flat" className="mt-8">
          <CardBody className="flex flex-wrap items-center justify-between gap-4 p-6">
            <div className="flex items-start gap-3">
              <span className="grid size-10 shrink-0 place-items-center rounded-md bg-jade-100 text-jade-800">
                <BedDouble className="size-5" aria-hidden />
              </span>
              <div>
                <p className="text-subtitle text-ink">Our Rishikesh stays</p>
                <p className="mt-1 text-small text-ink-muted">
                  {hotels.length} riverside camps and guesthouses you can book directly, with rooms and rates.
                </p>
              </div>
            </div>
            <LinkButton href="/hotels" variant="outline">
              Browse properties <ArrowRight className="size-4" aria-hidden />
            </LinkButton>
          </CardBody>
        </Card>
      )}

      {destinations.length === 0 ? (
        <EmptyState
          className="mt-12"
          icon={<MapPin />}
          title="No destinations listed yet"
          description="Destinations added from the admin panel appear here the moment they are published."
        />
      ) : (
        [...byRegion.entries()].map(([region, list]) => (
          <section key={region} className="mt-14">
            <h2 className="text-title text-ink">{region}</h2>
            <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {list.map((d) => (
                <DestinationCard key={d.id} destination={d} />
              ))}
            </div>
          </section>
        ))
      )}
    </div>
  );
}
