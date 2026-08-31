"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowDown, ArrowUp, ExternalLink, Plus, Trash2 } from "lucide-react";
import {
  Button,
  EmptyState,
  GradeChip,
  Switch,
  Table,
  TableScroller,
  Td,
  Th,
  Tr,
} from "@/components/ui";
import { formatDurationShort, formatINR, formatKm } from "@/lib/format";
import {
  deleteAdventure,
  moveAdventure,
  setAdventurePublished,
} from "@/app/actions/adventures";
import type { Adventure } from "@/db/schema";
import { Waves } from "lucide-react";

export function AdventureList({
  kind,
  items,
}: {
  kind: "rafting" | "bungee" | "activities";
  items: Adventure[];
}) {
  const [rows, setRows] = React.useState(items);
  const [pending, setPending] = React.useState<number | null>(null);
  const [query, setQuery] = React.useState("");

  const filtered = rows.filter((r) => r.name.toLowerCase().includes(query.toLowerCase()));
  const isActivities = kind === "activities";
  const label = kind === "rafting" ? "stretch" : kind === "bungee" ? "package" : "activity";
  const labelPlural =
    kind === "rafting" ? "stretches" : kind === "bungee" ? "packages" : "activities";
  const adminBase = isActivities ? "/admin/adventures" : `/admin/${kind}`;
  const newHref = `${adminBase}/new`;
  /** rafting → /rafting, bungee → /bungee, activities → /adventures */
  const viewBase = isActivities ? "/adventures" : `/${kind}`;

  async function handleMove(id: number, direction: "up" | "down") {
    setPending(id);
    const i = rows.findIndex((r) => r.id === id);
    const j = direction === "up" ? i - 1 : i + 1;
    if (j < 0 || j >= rows.length) {
      setPending(null);
      return;
    }
    const next = [...rows];
    [next[i], next[j]] = [next[j], next[i]];
    setRows(next);
    await moveAdventure(id, direction);
    setPending(null);
  }

  async function handleTogglePublished(id: number, isPublished: boolean) {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, isPublished } : r)));
    await setAdventurePublished(id, isPublished);
  }

  async function handleDelete(id: number, name: string) {
    if (!confirm(`Delete "${name}" permanently? Past enquiries for it are kept.`)) return;
    setPending(id);
    setRows((prev) => prev.filter((r) => r.id !== id));
    await deleteAdventure(id);
    setPending(null);
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={`Search ${labelPlural}…`}
          className="h-10 w-full max-w-xs rounded-md border border-granite-300 bg-canvas px-3 text-small text-ink placeholder:text-ink-faint focus:border-jade-600 focus:outline-none focus:ring-2 focus:ring-jade-600/25"
        />
        <Link href={newHref} className="no-underline">
          <Button size="sm">
            <Plus className="size-4" aria-hidden /> Add {label}
          </Button>
        </Link>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          className="mt-6"
          icon={<Waves />}
          title={rows.length === 0 ? `No ${labelPlural} yet` : "No matches"}
          description={
            rows.length === 0
              ? `Add your first ${label} and it appears on the site once published.`
              : "Try a different search."
          }
          action={
            rows.length === 0 ? (
              <Link href={newHref} className="no-underline">
                <Button size="sm">Add {label}</Button>
              </Link>
            ) : undefined
          }
        />
      ) : (
        <TableScroller label={labelPlural} className="mt-6">
          <Table>
            <thead>
              <tr>
                <Th>Name</Th>
                {kind === "bungee" && <Th>Operator</Th>}
                {kind === "rafting" && <Th>Grade</Th>}
                {!isActivities && (
                  <Th className="text-right">{kind === "rafting" ? "Distance" : "Height"}</Th>
                )}
                <Th className="text-right">Duration</Th>
                <Th className="text-right">Price</Th>
                <Th>Published</Th>
                <Th>Order</Th>
                <Th className="text-right">Actions</Th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r, i) => (
                <Tr key={r.id}>
                  <Td className="font-semibold whitespace-nowrap text-ink">{r.name}</Td>
                  {kind === "bungee" && (
                    <Td className="text-ink-muted">{r.brand ?? "—"}</Td>
                  )}
                  {kind === "rafting" && (
                    <Td>{r.grade && <GradeChip grade={r.grade} size="sm" />}</Td>
                  )}
                  {!isActivities && (
                    <Td className="text-right tabular">
                      {kind === "rafting" ? formatKm(r.distanceKm) : `${r.heightM ?? "—"} m`}
                    </Td>
                  )}
                  <Td className="text-right tabular">{formatDurationShort(r.durationMinutes)}</Td>
                  <Td className="text-right tabular font-semibold">{formatINR(r.priceInr)}</Td>
                  <Td>
                    <Switch
                      label=""
                      checked={r.isPublished}
                      onChange={(e) => handleTogglePublished(r.id, e.target.checked)}
                      disabled={pending === r.id}
                    />
                  </Td>
                  <Td>
                    <div className="flex gap-1">
                      <button
                        type="button"
                        disabled={i === 0 || pending === r.id}
                        onClick={() => handleMove(r.id, "up")}
                        className="grid size-8 place-items-center rounded-sm text-ink-faint transition-colors hover:bg-granite-100 hover:text-ink disabled:opacity-30"
                      >
                        <ArrowUp className="size-4" aria-hidden />
                        <span className="sr-only">Move up</span>
                      </button>
                      <button
                        type="button"
                        disabled={i === filtered.length - 1 || pending === r.id}
                        onClick={() => handleMove(r.id, "down")}
                        className="grid size-8 place-items-center rounded-sm text-ink-faint transition-colors hover:bg-granite-100 hover:text-ink disabled:opacity-30"
                      >
                        <ArrowDown className="size-4" aria-hidden />
                        <span className="sr-only">Move down</span>
                      </button>
                    </div>
                  </Td>
                  <Td>
                    <div className="flex items-center justify-end gap-3">
                      <a
                        href={`${viewBase}/${r.slug}`}
                        target="_blank"
                        rel="noopener"
                        className="text-ink-faint transition-colors hover:text-ink"
                        title="View on site"
                      >
                        <ExternalLink className="size-4" aria-hidden />
                      </a>
                      <Link
                        href={`${adminBase}/${r.id}/edit`}
                        className="text-small font-semibold text-link no-underline"
                      >
                        Edit
                      </Link>
                      <button
                        type="button"
                        onClick={() => handleDelete(r.id, r.name)}
                        className="text-ink-faint transition-colors hover:text-danger"
                        title="Delete"
                      >
                        <Trash2 className="size-4" aria-hidden />
                      </button>
                    </div>
                  </Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        </TableScroller>
      )}
    </div>
  );
}
