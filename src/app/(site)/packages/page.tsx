import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Package as PackageIcon } from "lucide-react";
import {
  Breadcrumb,
  EmptyState,
  SectionHeading,
  Table,
  TableScroller,
  Td,
  Th,
  Tr,
} from "@/components/ui";
import { PackageCard } from "@/components/site/catalog-cards";
import { getPackages, getSiteSettings } from "@/lib/content";
import { formatINR, slugify } from "@/lib/format";

export const revalidate = 120;

type Search = { category?: string };

/** The category name behind a `?category=` slug, or null when unfiltered. */
async function resolveCategory(slug: string | undefined): Promise<string | null> {
  if (!slug) return null;
  const match = (await getPackages()).find(
    (p) => p.category && slugify(p.category) === slug,
  );
  return match?.category ?? null;
}

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<Search>;
}): Promise<Metadata> {
  const { category } = await searchParams;
  const name = await resolveCategory(category);
  if (!name) {
    return {
      title: "Holiday packages — Uttarakhand & Himachal",
      description:
        "Char Dham and Do Dham yatra, a Rishikesh yoga course, and the Rishikesh + Mussoorie and Shimla + Manali tours. Itinerary, inclusions and starting price on every one.",
      alternates: { canonical: "/packages" },
    };
  }
  return {
    title: `${name} packages — Uttarakhand & Himachal`,
    description: `Every ${name.toLowerCase()} package we run, with the itinerary, what is included and the starting price on each one.`,
    // A filtered view is a slice of the full list, not a page of its own to
    // index — the canonical points back at the unfiltered index.
    alternates: { canonical: "/packages" },
  };
}

export default async function PackagesIndex({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  const { category } = await searchParams;
  const [all, settings] = await Promise.all([getPackages(), getSiteSettings()]);

  const categoryName = await resolveCategory(category);
  // An unknown `?category=` is a bad URL, not an empty list — same as the
  // `/adventures?brand=` view it mirrors.
  if (category && !categoryName) notFound();

  const packages = categoryName
    ? all.filter((p) => p.category === categoryName)
    : all;

  return (
    <div className="container-page pt-6 pb-8">
      <Breadcrumb
        items={[
          { label: "Home", href: "/" },
          ...(categoryName
            ? [{ label: "Packages", href: "/packages" }, { label: categoryName }]
            : [{ label: "Packages" }]),
        ]}
      />

      {categoryName && (
        <Link
          href="/packages"
          className="mt-4 inline-flex items-center gap-1.5 text-small font-semibold text-ink-muted no-underline hover:text-ink"
        >
          <ArrowLeft className="size-4" aria-hidden /> All packages
        </Link>
      )}

      <div className="pt-8">
        <SectionHeading
          as="h1"
          title={categoryName ?? "Holiday packages"}
          description={
            categoryName
              ? `Every ${categoryName.toLowerCase()} package we run. Each price is a starting-from figure; we confirm the final quote for your dates and group before anything is paid.`
              : "Fixed itineraries for the trips people ask us to plan most — the Char Dham and Do Dham pilgrimages, a week of yoga in Rishikesh, and the classic Uttarakhand and Himachal loops. Every price is a starting-from figure; we confirm the final quote for your dates and group before anything is paid."
          }
        />
      </div>

      {packages.length === 0 ? (
        <EmptyState
          className="mt-12"
          icon={<PackageIcon />}
          title="No packages listed yet"
          description="Packages added from the admin panel appear here the moment they are published."
        />
      ) : (
        <>
          <div className="mt-10">
            <TableScroller label={categoryName ? `Every ${categoryName.toLowerCase()} package compared` : "Every package compared"}>
              <Table>
                <thead>
                  <tr>
                    <Th>Package</Th>
                    {!categoryName && <Th>Type</Th>}
                    <Th>Route</Th>
                    <Th className="text-right">Duration</Th>
                    <Th className="text-right">From</Th>
                  </tr>
                </thead>
                <tbody>
                  {packages.map((p) => (
                    <Tr key={p.id}>
                      <Td className="font-semibold whitespace-nowrap">
                        <Link
                          href={`/packages/${p.slug}`}
                          className="text-ink no-underline hover:underline"
                        >
                          {p.name}
                        </Link>
                      </Td>
                      {!categoryName && (
                        <Td className="text-ink-muted">{p.category ?? "—"}</Td>
                      )}
                      <Td className="text-ink-muted">{p.routeLabel ?? "—"}</Td>
                      <Td className="text-right tabular">{p.durationLabel ?? "—"}</Td>
                      <Td className="text-right tabular font-semibold">
                        {formatINR(p.priceInr)}
                      </Td>
                    </Tr>
                  ))}
                </tbody>
              </Table>
            </TableScroller>
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {packages.map((p) => (
              <PackageCard key={p.id} pkg={p} whatsappNumber={settings.whatsappNumber} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
