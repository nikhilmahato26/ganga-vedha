import type { Metadata } from "next";
import Link from "next/link";
import {
  Alert,
  Breadcrumb,
  EmptyState,
  GradeChip,
  SectionHeading,
  Table,
  TableScroller,
  Td,
  Th,
  Tr,
} from "@/components/ui";
import { Waves } from "lucide-react";
import { AdventureCard } from "@/components/site/product-card";
import { getClosures, getRaftingByDistance, getSiteSettings } from "@/lib/content";
import { resolveClosure } from "@/lib/closure";
import { cn } from "@/lib/utils";
import { formatDuration, formatINR, formatKm } from "@/lib/format";

// 60s: matches the adventures cache window in @/lib/content.
export const revalidate = 60;

export const metadata: Metadata = {
  title: "River rafting in Rishikesh, by the kilometre",
  description:
    "Rafting on the Ganga at Rishikesh — 12, 16 and 26 km stretches, with or without drone video. Distance, grade, duration, age limit and price on every one.",
  alternates: { canonical: "/rafting" },
};

/** A Drone Craft listing is one where the drone crew films the run. */
const isDroneCraft = (slug: string) => slug.includes("drone-craft");

const FILTERS: { key: string; label: string; href: string }[] = [
  { key: "all", label: "All", href: "/rafting" },
  { key: "river", label: "River rafting", href: "/rafting?type=river" },
  { key: "dronecraft", label: "Dronecraft rafting", href: "/rafting?type=dronecraft" },
];

export default async function RaftingIndex({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  const { type } = await searchParams;
  const active = type === "river" || type === "dronecraft" ? type : "all";

  const [all, settings, closures] = await Promise.all([
    getRaftingByDistance(),
    getSiteSettings(),
    getClosures(),
  ]);
  const closure = resolveClosure(closures, { service: "rafting" });

  const stretches =
    active === "dronecraft"
      ? all.filter((a) => isDroneCraft(a.slug))
      : active === "river"
        ? all.filter((a) => !isDroneCraft(a.slug))
        : all;

  return (
    <div className="container-page pt-6 pb-8">
      <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "Rafting" }]} />
      <div className="pt-8">
        <SectionHeading
          as="h1"
          title="Rafting, by the kilometre"
          description="The distance is the decision. A longer run means bigger water and more rapids, not simply more of the same river — so we sell and compare every stretch on that axis. Dronecraft runs add a drone crew filming you the whole way down."
        />
      </div>

      <div className="mt-6 flex flex-wrap gap-2" role="group" aria-label="Filter rafting">
        {FILTERS.map((f) => (
          <Link
            key={f.key}
            href={f.href}
            aria-current={active === f.key ? "page" : undefined}
            className={cn(
              "inline-flex h-9 items-center rounded-full border px-4 text-small font-semibold no-underline transition-colors",
              active === f.key
                ? "border-jade-700 bg-jade-700 text-white"
                : "border-granite-300 bg-canvas text-ink-muted hover:border-granite-400 hover:text-ink",
            )}
          >
            {f.label}
          </Link>
        ))}
      </div>

      {closure && (
        <Alert tone="closed" title={closure.title} className="mt-8">
          {closure.body}
          {closure.footnote ? ` ${closure.footnote}.` : ""}
        </Alert>
      )}

      {stretches.length === 0 ? (
        <EmptyState
          className="mt-12"
          icon={<Waves />}
          title="Nothing in this category yet"
          description="Try another filter, or see every stretch."
        />
      ) : (
        <>
          <div className="mt-10">
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
                        <Link
                          href={`/rafting/${a.slug}`}
                          className="text-ink no-underline hover:underline"
                        >
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
        </>
      )}
    </div>
  );
}
