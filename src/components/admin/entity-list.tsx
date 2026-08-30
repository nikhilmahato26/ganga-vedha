"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowDown, ArrowUp, ExternalLink, Plus, Trash2 } from "lucide-react";
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

export type EntityRow = {
  id: number;
  name: string;
  slug: string;
  isPublished: boolean;
};

export type EntityColumn<T extends EntityRow> = {
  header: string;
  align?: "left" | "right";
  cell: (row: T) => React.ReactNode;
};

/**
 * The shared admin list — search, a publish toggle, move up/down, view-on-site,
 * edit and delete. Packages, rentals and destinations all use this; the only
 * per-entity part is `columns` and the copy.
 */
export function EntityList<T extends EntityRow>({
  items,
  columns,
  noun,
  nounPlural,
  basePath,
  viewPrefix,
  icon,
  actions,
}: {
  items: T[];
  columns: EntityColumn<T>[];
  /** e.g. "package" */
  noun: string;
  /** e.g. "packages" */
  nounPlural: string;
  /** e.g. "/admin/packages" */
  basePath: string;
  /** e.g. "/packages" — the public URL prefix for "view on site" */
  viewPrefix: string;
  icon: React.ReactNode;
  actions: {
    remove: (id: number) => Promise<unknown>;
    setPublished: (id: number, isPublished: boolean) => Promise<unknown>;
    move: (id: number, direction: "up" | "down") => Promise<unknown>;
  };
}) {
  const [rows, setRows] = React.useState(items);
  const [pending, setPending] = React.useState<number | null>(null);
  const [query, setQuery] = React.useState("");

  const filtered = rows.filter((r) =>
    r.name.toLowerCase().includes(query.toLowerCase()),
  );
  const newHref = `${basePath}/new`;

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
    await actions.move(id, direction);
    setPending(null);
  }

  async function handleTogglePublished(id: number, isPublished: boolean) {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, isPublished } : r)));
    await actions.setPublished(id, isPublished);
  }

  async function handleDelete(id: number, name: string) {
    if (!confirm(`Delete "${name}" permanently? Past enquiries for it are kept.`)) return;
    setPending(id);
    setRows((prev) => prev.filter((r) => r.id !== id));
    await actions.remove(id);
    setPending(null);
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={`Search ${nounPlural}…`}
          className="h-10 w-full max-w-xs rounded-md border border-granite-300 bg-canvas px-3 text-small text-ink placeholder:text-ink-faint focus:border-jade-600 focus:outline-none focus:ring-2 focus:ring-jade-600/25"
        />
        <Link href={newHref} className="no-underline">
          <Button size="sm">
            <Plus className="size-4" aria-hidden /> Add {noun}
          </Button>
        </Link>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          className="mt-6"
          icon={icon}
          title={rows.length === 0 ? `No ${nounPlural} yet` : "No matches"}
          description={
            rows.length === 0
              ? `Add your first ${noun} and it appears on the site once published.`
              : "Try a different search."
          }
          action={
            rows.length === 0 ? (
              <Link href={newHref} className="no-underline">
                <Button size="sm">Add {noun}</Button>
              </Link>
            ) : undefined
          }
        />
      ) : (
        <TableScroller label={nounPlural} className="mt-6">
          <Table>
            <thead>
              <tr>
                <Th>Name</Th>
                {columns.map((c) => (
                  <Th key={c.header} className={c.align === "right" ? "text-right" : undefined}>
                    {c.header}
                  </Th>
                ))}
                <Th>Published</Th>
                <Th>Order</Th>
                <Th className="text-right">Actions</Th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r, i) => (
                <Tr key={r.id}>
                  <Td className="font-semibold whitespace-nowrap text-ink">{r.name}</Td>
                  {columns.map((c) => (
                    <Td
                      key={c.header}
                      className={c.align === "right" ? "text-right tabular" : "text-ink-muted"}
                    >
                      {c.cell(r)}
                    </Td>
                  ))}
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
                        href={`${viewPrefix}/${r.slug}`}
                        target="_blank"
                        rel="noopener"
                        className="text-ink-faint transition-colors hover:text-ink"
                        title="View on site"
                      >
                        <ExternalLink className="size-4" aria-hidden />
                      </a>
                      <Link
                        href={`${basePath}/${r.id}/edit`}
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
