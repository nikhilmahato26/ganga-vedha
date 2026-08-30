import type { Metadata } from "next";
import Link from "next/link";
import { Package as PackageIcon } from "lucide-react";
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
import { formatINR } from "@/lib/format";

export const revalidate = 120;

export const metadata: Metadata = {
  title: "Holiday packages — Uttarakhand & Himachal",
  description:
    "Char Dham and Do Dham yatra, a Rishikesh yoga course, and the Rishikesh + Mussoorie and Shimla + Manali tours. Itinerary, inclusions and starting price on every one.",
  alternates: { canonical: "/packages" },
};

export default async function PackagesIndex() {
  const [packages, settings] = await Promise.all([getPackages(), getSiteSettings()]);

  return (
    <div className="container-page pt-6 pb-8">
      <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "Packages" }]} />

      <div className="pt-8">
        <SectionHeading
          as="h1"
          title="Holiday packages"
          description="Fixed itineraries for the trips people ask us to plan most — the Char Dham and Do Dham pilgrimages, a week of yoga in Rishikesh, and the classic Uttarakhand and Himachal loops. Every price is a starting-from figure; we confirm the final quote for your dates and group before anything is paid."
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
            <TableScroller label="Every package compared">
              <Table>
                <thead>
                  <tr>
                    <Th>Package</Th>
                    <Th>Type</Th>
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
                      <Td className="text-ink-muted">{p.category ?? "—"}</Td>
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
