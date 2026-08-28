import type { Metadata } from "next";
import Link from "next/link";
import {
  Alert,
  Breadcrumb,
  GradeChip,
  SectionHeading,
  Table,
  TableScroller,
  Td,
  Th,
  Tr,
} from "@/components/ui";
import { AdventureCard } from "@/components/site/product-card";
import { getClosures, getRaftingByDistance, getSiteSettings } from "@/lib/content";
import { resolveClosure } from "@/lib/closure";
import { formatDuration, formatINR, formatKm } from "@/lib/format";

// 60s: matches the adventures cache window in @/lib/content.
export const revalidate = 60;

export const metadata: Metadata = {
  title: "River rafting in Rishikesh, by the kilometre",
  description:
    "Five rafting stretches on the Ganga from 12 km to 32 km. Distance, grade, duration, age limit and price on every one.",
  alternates: { canonical: "/rafting" },
};

export default async function RaftingIndex() {
  const [stretches, settings, closures] = await Promise.all([
    getRaftingByDistance(),
    getSiteSettings(),
    getClosures(),
  ]);
  const closure = resolveClosure(closures, { service: "rafting" });

  return (
    <div className="container-page pt-6 pb-8">
      <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "Rafting" }]} />
      <div className="pt-8">
        <SectionHeading
          as="h1"
          title="Rafting, by the kilometre"
          description="The distance is the decision. A longer run means bigger water and more rapids, not simply more of the same river — so we sell and compare every stretch on that axis."
        />
      </div>

      {closure && (
        <Alert tone="closed" title={closure.title} className="mt-8">
          {closure.body}
          {closure.footnote ? ` ${closure.footnote}.` : ""}
        </Alert>
      )}
      <div className="mt-12">
        <TableScroller label="Every rafting stretch compared">
          <Table>
            <thead>
              <tr>
                <Th>Stretch</Th>
                <Th>Put-in</Th>
                <Th>Grade</Th>
                <Th className="text-right">Distance</Th>
                <Th className="text-right">Duration</Th>
                <Th className="text-right">Min age</Th>
                <Th className="text-right">Price</Th>
              </tr>
            </thead>
            <tbody>
              {stretches.map((a) => (
                <Tr key={a.id}>
                  <Td className="font-semibold whitespace-nowrap">
                    <Link href={`/rafting/${a.slug}`} className="text-ink no-underline hover:underline">
                      {a.name}
                    </Link>
                  </Td>
                  <Td className="text-ink-muted">{a.putInPoint}</Td>
                  <Td>{a.grade && <GradeChip grade={a.grade} size="sm" />}</Td>
                  <Td className="text-right tabular">{formatKm(a.distanceKm)}</Td>
                  <Td className="text-right tabular">{formatDuration(a.durationMinutes)}</Td>
                  <Td className="text-right tabular">{a.minAge}</Td>
                  <Td className="text-right tabular font-semibold">{formatINR(a.priceInr)}</Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        </TableScroller>
      </div>

      <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {stretches.map((a, i) => (
          <AdventureCard
            key={a.id}
            adventure={a}
            closure={resolveClosure(closures, {
              service: "rafting",
              entityType: "adventure",
              entityId: a.id,
            })}
            whatsappNumber={settings.whatsappNumber}
            priority={i === 0}
          />
        ))}
      </div>
    </div>
  );
}
