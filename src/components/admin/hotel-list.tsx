"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowDown, ArrowUp, BedDouble, ExternalLink, Plus, Trash2 } from "lucide-react";
import {
  Button,
  EmptyState,
  Switch,
  Table,
  TableScroller,
  Td,
  Th,
  Tr,
} from "@/components/ui";
import { formatINR } from "@/lib/format";
import { deleteHotel, moveHotel, setHotelPublished } from "@/app/actions/hotels";
import type { Hotel } from "@/db/schema";

type HotelWithRooms = Hotel & { rooms: unknown[] };

export function HotelList({ items }: { items: HotelWithRooms[] }) {
  const [rows, setRows] = React.useState(items);
  const [pending, setPending] = React.useState<number | null>(null);
  const [query, setQuery] = React.useState("");

  const filtered = rows.filter((r) => r.name.toLowerCase().includes(query.toLowerCase()));

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
    await moveHotel(id, direction);
    setPending(null);
  }

  async function handleTogglePublished(id: number, isPublished: boolean) {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, isPublished } : r)));
    await setHotelPublished(id, isPublished);
  }

  async function handleDelete(id: number, name: string) {
    if (!confirm(`Delete "${name}" permanently? Past enquiries for it are kept.`)) return;
    setPending(id);
    setRows((prev) => prev.filter((r) => r.id !== id));
    await deleteHotel(id);
    setPending(null);
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search hotels…"
          className="h-10 w-full max-w-xs rounded-md border border-granite-300 bg-canvas px-3 text-small text-ink placeholder:text-ink-faint focus:border-jade-600 focus:outline-none focus:ring-2 focus:ring-jade-600/25"
        />
        <Link href="/admin/hotels/new" className="no-underline">
          <Button size="sm">
            <Plus className="size-4" aria-hidden /> Add hotel
          </Button>
        </Link>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          className="mt-6"
          icon={<BedDouble />}
          title={rows.length === 0 ? "No hotels yet" : "No matches"}
          description={
            rows.length === 0
              ? "Add your first property and it appears on the site once published."
              : "Try a different search."
          }
          action={
            rows.length === 0 ? (
              <Link href="/admin/hotels/new" className="no-underline">
                <Button size="sm">Add hotel</Button>
              </Link>
            ) : undefined
          }
        />
      ) : (
        <TableScroller label="Hotels" className="mt-6">
          <Table>
            <thead>
              <tr>
                <Th>Name</Th>
                <Th>Locality</Th>
                <Th className="text-right">Rooms</Th>
                <Th className="text-right">From</Th>
                <Th>Published</Th>
                <Th>Order</Th>
                <Th className="text-right">Actions</Th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r, i) => (
                <Tr key={r.id}>
                  <Td className="font-semibold whitespace-nowrap text-ink">{r.name}</Td>
                  <Td className="text-ink-muted">{r.locality}</Td>
                  <Td className="text-right tabular">{r.rooms.length}</Td>
                  <Td className="text-right tabular font-semibold">{formatINR(r.pricePerNightInr)}</Td>
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
                        href={`/hotels/${r.slug}`}
                        target="_blank"
                        rel="noopener"
                        className="text-ink-faint transition-colors hover:text-ink"
                        title="View on site"
                      >
                        <ExternalLink className="size-4" aria-hidden />
                      </a>
                      <Link
                        href={`/admin/hotels/${r.id}/edit`}
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
