"use client";

import * as React from "react";
import Link from "next/link";
import {
  Alert,
  GradeChip,
  LinkButton,
  SectionHeading,
  Table,
  TableScroller,
  Td,
  Th,
  Tr,
} from "@/components/ui";
import { AdventureCard } from "@/components/site/product-card";
import { resolveClosure } from "@/lib/closure";
import { cn } from "@/lib/utils";
import { formatDuration, formatINR, formatKm } from "@/lib/format";
import type { Adventure, Closure } from "@/lib/content";

/** A Drone Craft listing is one where the drone crew films the run. */
const isDroneCraft = (slug: string) => slug.includes("drone-craft");

const FILTERS = [
  { key: "all", label: "All" },
  { key: "river", label: "River rafting" },
  { key: "dronecraft", label: "Dronecraft rafting" },
] as const;
type FilterKey = (typeof FILTERS)[number]["key"];

/**
 * The home page's "Rafting, by the kilometre" block. A client component so the
 * All / River / Dronecraft pills can filter the table and card grid without a
 * page navigation — the standalone /rafting page does the same with a URL param.
 */
export function RaftingSection({
  stretches,
  closures,
  whatsappNumber,
}: {
  stretches: Adventure[];
  closures: Closure[];
  whatsappNumber: string;
}) {
  const [filter, setFilter] = React.useState<FilterKey>("all");

  const raftingClosure = resolveClosure(closures, { service: "rafting" });
  const visible =
    filter === "dronecraft"
      ? stretches.filter((a) => isDroneCraft(a.slug))
      : filter === "river"
        ? stretches.filter((a) => !isDroneCraft(a.slug))
        : stretches;

  return (
    <section id="rafting" className="container-page scroll-mt-28 pt-24">
      <SectionHeading
        as="h2"
        title="Rafting, by the kilometre"
        description="The distance is the decision. Longer runs mean bigger water, more rapids and a longer day — not simply more of the same river. Dronecraft runs add a drone crew filming you the whole way down."
        action={
          <LinkButton href="/rafting" variant="outline">
            Compare all stretches
          </LinkButton>
        }
      />

      <div className="mt-6 flex flex-wrap gap-2" role="group" aria-label="Filter rafting">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => setFilter(f.key)}
            aria-pressed={filter === f.key}
            className={cn(
              "inline-flex h-9 items-center rounded-full border px-4 text-small font-semibold transition-colors",
              filter === f.key
                ? "border-jade-700 bg-jade-700 text-white"
                : "border-granite-300 bg-canvas text-ink-muted hover:border-granite-400 hover:text-ink",
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {raftingClosure && (
        <Alert tone="closed" title={raftingClosure.title} className="mt-8">
          {raftingClosure.body}
        </Alert>
      )}

      <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {visible.map((a, i) => (
          <AdventureCard
            key={a.id}
            adventure={a}
            closure={resolveClosure(closures, {
              service: "rafting",
              entityType: "adventure",
              entityId: a.id,
            })}
            whatsappNumber={whatsappNumber}
            priority={i === 0}
          />
        ))}
      </div>

      {/* The comparison the cards cannot make: every stretch on one axis. */}
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
              {visible.map((a) => (
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
    </section>
  );
}
