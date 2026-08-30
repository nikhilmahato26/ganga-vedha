"use client";

import * as React from "react";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui";

export type ItineraryDay = { title: string; detail: string };

/**
 * A reorderable day-by-day list for a package itinerary. Same idea as
 * FaqEditor, but with a "Day 1" title and a longer detail field, and the
 * order matters so it has move controls.
 */
export function ItineraryEditor({
  value,
  onChange,
}: {
  value: ItineraryDay[];
  onChange: (next: ItineraryDay[]) => void;
}) {
  function update(i: number, patch: Partial<ItineraryDay>) {
    onChange(value.map((d, idx) => (idx === i ? { ...d, ...patch } : d)));
  }
  function remove(i: number) {
    onChange(value.filter((_, idx) => idx !== i));
  }
  function move(i: number, dir: "up" | "down") {
    const j = dir === "up" ? i - 1 : i + 1;
    if (j < 0 || j >= value.length) return;
    const next = [...value];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  }
  function add() {
    onChange([...value, { title: `Day ${value.length + 1}`, detail: "" }]);
  }

  const inputCls =
    "w-full rounded-sm border border-granite-300 bg-canvas px-3 text-small text-ink placeholder:text-ink-faint focus:border-jade-600 focus:outline-none focus:ring-2 focus:ring-jade-600/25";

  return (
    <div className="space-y-3">
      {value.map((d, i) => (
        <div key={i} className="rounded-md border border-hairline bg-canvas-sunk p-3">
          <div className="flex items-start gap-2">
            <div className="flex shrink-0 flex-col gap-1 pt-1">
              <button
                type="button"
                onClick={() => move(i, "up")}
                disabled={i === 0}
                className="grid size-7 place-items-center rounded-sm text-ink-faint hover:bg-granite-100 hover:text-ink disabled:opacity-30"
              >
                <ArrowUp className="size-3.5" aria-hidden />
                <span className="sr-only">Move up</span>
              </button>
              <button
                type="button"
                onClick={() => move(i, "down")}
                disabled={i === value.length - 1}
                className="grid size-7 place-items-center rounded-sm text-ink-faint hover:bg-granite-100 hover:text-ink disabled:opacity-30"
              >
                <ArrowDown className="size-3.5" aria-hidden />
                <span className="sr-only">Move down</span>
              </button>
            </div>
            <div className="min-w-0 flex-1 space-y-2">
              <input
                value={d.title}
                onChange={(e) => update(i, { title: e.target.value })}
                placeholder="Day 1"
                className={`min-h-9 ${inputCls}`}
              />
              <textarea
                value={d.detail}
                onChange={(e) => update(i, { detail: e.target.value })}
                placeholder="What happens on this day…"
                rows={2}
                className={`py-2 ${inputCls}`}
              />
            </div>
            <button
              type="button"
              onClick={() => remove(i)}
              className="mt-1 grid size-9 shrink-0 place-items-center rounded-sm text-ink-faint transition-colors hover:bg-danger-soft hover:text-danger"
            >
              <Trash2 className="size-4" aria-hidden />
              <span className="sr-only">Remove day</span>
            </button>
          </div>
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" onClick={add}>
        <Plus className="size-4" aria-hidden /> Add a day
      </Button>
    </div>
  );
}
