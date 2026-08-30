import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BedDouble,
  Bike,
  ExternalLink,
  MapPin,
  Mountain,
  Package as PackageIcon,
  Star,
  Waves,
  Wind,
} from "lucide-react";
import { getSession } from "@/lib/auth";
import { Card, CardBody } from "@/components/ui";
import {
  getActivities,
  getAdventures,
  getDestinations,
  getHotels,
  getPackages,
  getRentals,
  getReviews,
  isSeedContent,
} from "@/lib/content";
import { getEnquiryStats } from "@/lib/admin-data";
import { listServiceClosures } from "@/app/actions/closures";
import { ClosurePanel } from "@/components/admin/closure-panel";

export const metadata: Metadata = {
  title: "Dashboard",
  robots: { index: false, follow: false },
};

/** Labels for the per-kind enquiry breakdown. */
const KIND_LABEL: Record<string, string> = {
  rafting: "Rafting",
  bungee: "Bungee",
  activity: "Activities",
  hotel: "Hotels",
  package: "Packages",
  rental: "Rentals",
  general: "General",
};
const KIND_ORDER = ["rafting", "bungee", "activity", "hotel", "package", "rental", "general"];

export default async function AdminDashboard() {
  const [
    session,
    rafting,
    bungee,
    activities,
    packages,
    destinations,
    hotels,
    rentals,
    reviews,
    stats,
    closures,
  ] = await Promise.all([
    getSession(),
    getAdventures("rafting"),
    getAdventures("bungee"),
    getActivities(),
    getPackages(),
    getDestinations(),
    getHotels(),
    getRentals(),
    getReviews(),
    getEnquiryStats(),
    listServiceClosures(),
  ]);

  const anyClosed = closures.some((c) => c.isActive);
  const kindEntries = KIND_ORDER.filter((k) => (stats.byKind[k] ?? 0) > 0);

  const catalog = [
    { label: "Rafting stretches", value: rafting.length, icon: Waves, href: "/admin/rafting" },
    { label: "Bungee operators", value: bungee.length, icon: Mountain, href: "/admin/bungee" },
    { label: "Adventures", value: activities.length, icon: Wind, href: "/admin/adventures" },
    { label: "Packages", value: packages.length, icon: PackageIcon, href: "/admin/packages" },
    { label: "Destinations", value: destinations.length, icon: MapPin, href: "/admin/destinations" },
    { label: "Hotels", value: hotels.length, icon: BedDouble, href: "/admin/hotels" },
    { label: "Rentals", value: rentals.length, icon: Bike, href: "/admin/rentals" },
    { label: "Reviews", value: reviews.length, icon: Star, href: "/admin/reviews" },
  ];

  return (
    <div className="mx-auto max-w-5xl">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-display-md text-ink">
            Welcome{session?.name ? `, ${session.name}` : ""}
          </h1>
          <p className="mt-2 text-ink-muted">
            {isSeedContent()
              ? "Running on placeholder content — DATABASE_URL is not configured."
              : "Connected to the live database."}
          </p>
        </div>
        {anyClosed && (
          <span className="rounded-full bg-closed-soft px-3.5 py-1.5 text-small font-semibold text-closed">
            A service is closed to bookings
          </span>
        )}
      </div>

      {/* Enquiry stats — the numbers that answer "how are we doing". */}
      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {[
          ["Today", stats.today],
          ["This week", stats.week],
          ["This month", stats.month],
        ].map(([label, value]) => (
          <Card key={label} elevation="flat">
            <CardBody className="p-5">
              <p className="tabular text-display-md leading-none text-ink">{value}</p>
              <p className="mt-1.5 text-small text-ink-muted">{label} · new enquiries</p>
            </CardBody>
          </Card>
        ))}
      </div>

      <Card elevation="flat" className="mt-4">
        <CardBody className="flex flex-wrap items-center justify-between gap-4 p-5">
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-small">
            {(["new", "contacted", "confirmed", "completed", "lost"] as const).map((s) => (
              <span key={s} className="text-ink-muted">
                <strong className="tabular font-semibold text-ink">{stats.funnel[s] ?? 0}</strong> {s}
              </span>
            ))}
            {stats.topProduct && (
              <span className="text-ink-muted">
                Most enquired:{" "}
                <strong className="font-semibold text-ink">{stats.topProduct.name}</strong>
              </span>
            )}
          </div>
          <Link
            href="/admin/bookings"
            className="inline-flex items-center gap-1.5 text-small font-semibold text-link no-underline"
          >
            Open bookings <ArrowRight className="size-4" aria-hidden />
          </Link>
        </CardBody>
      </Card>

      {/* Where the enquiries are coming from — one row per product kind. */}
      {kindEntries.length > 0 && (
        <Card elevation="flat" className="mt-4">
          <CardBody className="p-5">
            <p className="text-small font-semibold text-ink">Enquiries by type (all time)</p>
            <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2 text-small">
              {kindEntries.map((k) => (
                <span key={k} className="text-ink-muted">
                  <strong className="tabular font-semibold text-ink">{stats.byKind[k]}</strong>{" "}
                  {KIND_LABEL[k] ?? k}
                </span>
              ))}
            </div>
          </CardBody>
        </Card>
      )}

      {/* The monsoon switch. */}
      <div className="mt-8">
        <ClosurePanel items={closures} />
      </div>

      {/* Catalogue — what's live on the site, and a jump to each editor. */}
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {catalog.map((s) => (
          <Link key={s.label} href={s.href} className="no-underline">
            <Card interactive elevation="flat" className="h-full">
              <CardBody className="flex items-center gap-4 p-5">
                <span className="grid size-11 shrink-0 place-items-center rounded-md bg-jade-100 text-jade-800">
                  <s.icon className="size-5" aria-hidden />
                </span>
                <div>
                  <p className="tabular text-title leading-none text-ink">{s.value}</p>
                  <p className="mt-1 text-small text-ink-muted">{s.label}</p>
                </div>
              </CardBody>
            </Card>
          </Link>
        ))}
      </div>

      <p className="mt-8">
        <a
          href="/"
          target="_blank"
          rel="noopener"
          className="inline-flex items-center gap-1.5 text-small font-semibold text-link no-underline"
        >
          View the live site <ExternalLink className="size-3.5" aria-hidden />
        </a>
      </p>
    </div>
  );
}
