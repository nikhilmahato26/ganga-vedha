"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowDown, ArrowUp, Megaphone, Plus, Trash2 } from "lucide-react";
import { Button, EmptyState, Switch } from "@/components/ui";
import {
  deletePromotion,
  movePromotion,
  setPromotionActive,
} from "@/app/actions/promotions";
import type { Promotion } from "@/db/schema";

export function PromotionList({ items }: { items: Promotion[] }) {
  const [rows, setRows] = React.useState(items);
  const [pending, setPending] = React.useState<number | null>(null);

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
    await movePromotion(id, direction);
    setPending(null);
  }

  async function toggle(id: number, isActive: boolean) {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, isActive } : r)));
    await setPromotionActive(id, isActive);
  }

  async function remove(id: number, title: string) {
    if (!confirm(`Delete the promotion "${title}"? This can't be undone.`)) return;
    setPending(id);
    setRows((prev) => prev.filter((r) => r.id !== id));
    await deletePromotion(id);
    setPending(null);
  }

  return (
    <div>
      <div className="flex justify-end">
        <Link href="/admin/promotions/new" className="no-underline">
          <Button size="sm">
            <Plus className="size-4" aria-hidden /> Add promotion
          </Button>
        </Link>
      </div>

      {rows.length === 0 ? (
        <EmptyState
          className="mt-6"
          icon={<Megaphone />}
          title="No promotions yet"
          description="Add one and it appears in the strip under the homepage hero once it's live."
          action={
            <Link href="/admin/promotions/new" className="no-underline">
              <Button size="sm">Add promotion</Button>
            </Link>
          }
        />
      ) : (
        <ul className="mt-6 space-y-3">
          {rows.map((r, i) => (
            <li
              key={r.id}
              className="flex flex-wrap items-center gap-4 rounded-lg border border-hairline bg-canvas p-4"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-ink">{r.title}</p>
                {r.body && <p className="mt-0.5 truncate text-small text-ink-muted">{r.body}</p>}
                {r.ctaLabel && r.ctaHref && (
                  <p className="mt-1 text-caption text-ink-faint">
                    Button: “{r.ctaLabel}” → {r.ctaHref}
                  </p>
                )}
              </div>

              <Switch
                label=""
                checked={r.isActive}
                onChange={(e) => toggle(r.id, e.target.checked)}
                disabled={pending === r.id}
              />

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
                  disabled={i === rows.length - 1 || pending === r.id}
                  onClick={() => handleMove(r.id, "down")}
                  className="grid size-8 place-items-center rounded-sm text-ink-faint transition-colors hover:bg-granite-100 hover:text-ink disabled:opacity-30"
                >
                  <ArrowDown className="size-4" aria-hidden />
                  <span className="sr-only">Move down</span>
                </button>
              </div>

              <div className="flex items-center gap-3">
                <Link
                  href={`/admin/promotions/${r.id}/edit`}
                  className="text-small font-semibold text-link no-underline"
                >
                  Edit
                </Link>
                <button
                  type="button"
                  onClick={() => remove(r.id, r.title)}
                  className="text-ink-faint transition-colors hover:text-danger"
                  title="Delete"
                >
                  <Trash2 className="size-4" aria-hidden />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
