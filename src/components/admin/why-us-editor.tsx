"use client";

import * as React from "react";
import { Plus, Save, Trash2 } from "lucide-react";
import { Button, Field, Input, useToast } from "@/components/ui";
import { updateWhyUsBlock } from "@/app/actions/content-blocks";
import { WHY_US_ICONS, type WhyUsIconKey } from "@/lib/why-us-icons";
import type { WhyUsItem } from "@/lib/content";

const ICON_KEYS = Object.keys(WHY_US_ICONS) as WhyUsIconKey[];

export function WhyUsEditor({
  title: initialTitle,
  subtitle: initialSubtitle,
  items: initialItems,
}: {
  title: string;
  subtitle: string | null;
  items: WhyUsItem[];
}) {
  const { toast } = useToast();
  const [title, setTitle] = React.useState(initialTitle);
  const [subtitle, setSubtitle] = React.useState(initialSubtitle ?? "");
  const [items, setItems] = React.useState<WhyUsItem[]>(initialItems);
  const [saving, setSaving] = React.useState(false);
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  function update(i: number, patch: Partial<WhyUsItem>) {
    setItems((prev) => prev.map((it, idx) => (idx === i ? { ...it, ...patch } : it)));
  }
  function remove(i: number) {
    setItems((prev) => prev.filter((_, idx) => idx !== i));
  }
  function add() {
    setItems((prev) => [...prev, { icon: "sparkles", title: "", body: "" }]);
  }

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const result = await updateWhyUsBlock({ title, subtitle: subtitle || null, items });
    setSaving(false);
    if (!result?.ok) {
      setErrors(result?.fieldErrors ?? {});
      toast({ tone: "error", title: result?.error ?? "Something went wrong." });
      return;
    }
    toast({ tone: "success", title: "Saved" });
  }

  return (
    <form onSubmit={onSave} className="space-y-5" noValidate>
      <p className="text-small text-ink-muted">
        The four-reason grid on the homepage, between the stays section and reviews.
      </p>

      <Field label="Section heading" required error={errors.title}>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} required />
      </Field>
      <Field label="Section subheading">
        <Input value={subtitle} onChange={(e) => setSubtitle(e.target.value)} />
      </Field>

      <div className="space-y-4">
        {items.map((item, i) => (
          <div key={i} className="rounded-md border border-hairline bg-canvas-sunk p-4">
            <div className="flex items-start gap-3">
              <div className="min-w-0 flex-1 space-y-3">
                <div className="grid gap-3 sm:grid-cols-[auto_1fr]">
                  <select
                    aria-label="Icon"
                    value={item.icon}
                    onChange={(e) => update(i, { icon: e.target.value })}
                    className="h-11 rounded-md border border-granite-300 bg-canvas px-3 text-small text-ink focus:border-jade-600 focus:outline-none focus:ring-2 focus:ring-jade-600/25"
                  >
                    {ICON_KEYS.map((k) => (
                      <option key={k} value={k}>
                        {k}
                      </option>
                    ))}
                  </select>
                  <input
                    value={item.title}
                    onChange={(e) => update(i, { title: e.target.value })}
                    placeholder="Reason title"
                    className="h-11 min-w-0 rounded-md border border-granite-300 bg-canvas px-3.5 text-body text-ink placeholder:text-ink-faint focus:border-jade-600 focus:outline-none focus:ring-2 focus:ring-jade-600/25"
                  />
                </div>
                {/* Plain native textarea, matching FaqEditor/RoomEditor's pattern
                    for a repeating row: the design system's <Textarea> needs a
                    <Field> label wrapper, which a compact inline row has no
                    room for. */}
                <textarea
                  rows={2}
                  value={item.body}
                  onChange={(e) => update(i, { body: e.target.value })}
                  placeholder="One or two sentences explaining it."
                  className="w-full rounded-md border border-granite-300 bg-canvas px-3.5 py-2.5 text-body text-ink placeholder:text-ink-faint focus:border-jade-600 focus:outline-none focus:ring-2 focus:ring-jade-600/25"
                />
              </div>
              <button
                type="button"
                onClick={() => remove(i)}
                disabled={items.length <= 1}
                className="mt-1 grid size-9 shrink-0 place-items-center rounded-sm text-ink-faint transition-colors hover:bg-danger-soft hover:text-danger disabled:opacity-30"
              >
                <Trash2 className="size-4" aria-hidden />
                <span className="sr-only">Remove</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button type="button" variant="outline" size="sm" onClick={add} disabled={items.length >= 8}>
          <Plus className="size-4" aria-hidden /> Add a reason
        </Button>
        <Button type="submit" loading={saving} loadingLabel="Saving">
          <Save className="size-4" aria-hidden /> Save section
        </Button>
      </div>
    </form>
  );
}
