import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Car } from "lucide-react";
import { Breadcrumb, EmptyState, SectionHeading } from "@/components/ui";
import { RentalCard } from "@/components/site/catalog-cards";
import { getRentals, getSiteSettings } from "@/lib/content";

export const revalidate = 300;

type RentalKind = "car" | "bike";
type Search = { kind?: string };

/** Heading, blurb and nav wording for each `?kind=` view. */
const KIND_COPY: Record<RentalKind, { title: string; description: string }> = {
  car: {
    title: "Cars with a driver",
    description:
      "Every car we rent comes with a driver and is priced per route — send us your itinerary and we'll quote a fixed figure that includes fuel, tolls and the driver's allowance.",
  },
  bike: {
    title: "Bikes & scooters",
    description:
      "Geared bikes and scooters at a flat daily rate from our Tapovan office. Bring the documents listed on each vehicle; the deposit comes back when the bike does.",
  },
};

function asKind(value: string | undefined): RentalKind | null {
  return value === "car" || value === "bike" ? value : null;
}

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<Search>;
}): Promise<Metadata> {
  const kind = asKind((await searchParams).kind);
  if (!kind) {
    return {
      title: "Car & bike rental in Rishikesh",
      description:
        "Cars with a driver, priced per route on a custom quote, and geared bikes and scooters at ₹600 a day. Documents, deposit and pickup details up front.",
      alternates: { canonical: "/rentals" },
    };
  }
  return {
    title: `${KIND_COPY[kind].title} in Rishikesh`,
    description: KIND_COPY[kind].description,
    // A filtered view is a slice of the full list, not a page of its own to
    // index — the canonical points back at the unfiltered index.
    alternates: { canonical: "/rentals" },
  };
}

export default async function RentalsIndex({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  const { kind: kindParam } = await searchParams;
  const [all, settings] = await Promise.all([getRentals(), getSiteSettings()]);

  const kind = asKind(kindParam);
  // An unknown `?kind=` is a bad URL, not an empty list.
  if (kindParam && !kind) notFound();

  const rentals = kind ? all.filter((r) => r.kind === kind) : all;

  return (
    <div className="container-page pt-6 pb-8">
      <Breadcrumb
        items={[
          { label: "Home", href: "/" },
          ...(kind
            ? [{ label: "Rentals", href: "/rentals" }, { label: KIND_COPY[kind].title }]
            : [{ label: "Rentals" }]),
        ]}
      />

      {kind && (
        <Link
          href="/rentals"
          className="mt-4 inline-flex items-center gap-1.5 text-small font-semibold text-ink-muted no-underline hover:text-ink"
        >
          <ArrowLeft className="size-4" aria-hidden /> All rentals
        </Link>
      )}

      <div className="pt-8">
        <SectionHeading
          as="h1"
          title={kind ? KIND_COPY[kind].title : "Car & bike rental"}
          description={
            kind
              ? KIND_COPY[kind].description
              : "A car comes with a driver and is priced per route — send us your itinerary and we'll quote a fixed figure that includes fuel, tolls and the driver's allowance. Bikes and scooters are a flat daily rate from our Tapovan office."
          }
        />
      </div>

      {rentals.length === 0 ? (
        <EmptyState
          className="mt-12"
          icon={<Car />}
          title={kind ? `No ${KIND_COPY[kind].title.toLowerCase()} listed yet` : "No rentals listed yet"}
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
