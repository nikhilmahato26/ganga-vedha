"use client";

import * as React from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui";

export type FaqPair = { q: string; a: string };

/**
 * A repeatable question/answer list. Every FAQ block on the site (adventures,
 * hotels) shares this shape, so one editor serves both rather than a
 * bespoke JSON textarea a non-technical owner would never touch correctly.
 */
export function FaqEditor({
  value,
  onChange,
}: {
  value: FaqPair[];
  onChange: (next: FaqPair[]) => void;
}) {
  function update(i: number, patch: Partial<FaqPair>) {
    onChange(value.map((f, idx) => (idx === i ? { ...f, ...patch } : f)));
  }
  function remove(i: number) {
    onChange(value.filter((_, idx) => idx !== i));
  }
  function add() {
    onChange([...value, { q: "", a: "" }]);
  }

  return (
    <div className="space-y-3">
      {value.map((f, i) => (
        <div key={i} className="rounded-md border border-hairline bg-canvas-sunk p-3">
          <div className="flex items-start gap-2">
            <div className="min-w-0 flex-1 space-y-2">
              <input
                value={f.q}
                onChange={(e) => update(i, { q: e.target.value })}
                placeholder="Question"
                className="min-h-10 w-full rounded-sm border border-granite-300 bg-canvas px-3 text-small text-ink placeholder:text-ink-faint focus:border-jade-600 focus:outline-none focus:ring-2 focus:ring-jade-600/25"
              />
              <textarea
                value={f.a}
                onChange={(e) => update(i, { a: e.target.value })}
                placeholder="Answer"
                rows={2}
                className="w-full rounded-sm border border-granite-300 bg-canvas px-3 py-2 text-small text-ink placeholder:text-ink-faint focus:border-jade-600 focus:outline-none focus:ring-2 focus:ring-jade-600/25"
              />
            </div>
            <button
              type="button"
              onClick={() => remove(i)}
              className="mt-1 grid size-9 shrink-0 place-items-center rounded-sm text-ink-faint transition-colors hover:bg-danger-soft hover:text-danger"
            >
              <Trash2 className="size-4" aria-hidden />
              <span className="sr-only">Remove question</span>
            </button>
          </div>
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" onClick={add}>
        <Plus className="size-4" aria-hidden /> Add a question
      </Button>
    </div>
  );
}
