"use client";

import * as React from "react";
import Image from "next/image";
import { ArrowDown, ArrowUp, Plus, Save, Trash2, X } from "lucide-react";
import { Button, Field, Input, Select, useToast } from "@/components/ui";
import { ImageUploader } from "@/components/admin/uploader";
import { updateHeroRoomsBlock } from "@/app/actions/content-blocks";
import { HERO_ROOMS_MAX, type HeroRoomItem } from "@/lib/hero-rooms";
import type { MediaItem } from "@/lib/media-types";

/** What the server hands in: the stored item plus its uploaded photo, resolved for preview. */
export type HeroRoomEditorValue = HeroRoomItem & { media: MediaItem | null };

/** `key` keeps each row's uploader state attached to it through a reorder. */
type EditableRow = HeroRoomEditorValue & { key: string };

let tempKeySeq = 0;
const nextKey = () => `row-${tempKeySeq++}`;

export function HeroRoomsEditor({ items: initialItems }: { items: HeroRoomEditorValue[] }) {
  const { toast } = useToast();
  const [rows, setRows] = React.useState<EditableRow[]>(() =>
    initialItems.map((r) => ({ ...r, key: nextKey() })),
  );
  const [saving, setSaving] = React.useState(false);
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  function update(key: string, patch: Partial<EditableRow>) {
    setRows((prev) => prev.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  }
  function remove(key: string) {
    setRows((prev) => prev.filter((r) => r.key !== key));
  }
  function move(i: number, by: -1 | 1) {
    setRows((prev) => {
      const next = [...prev];
      [next[i], next[i + by]] = [next[i + by], next[i]];
      return next;
    });
  }
  function add() {
    setRows((prev) => [
      ...prev,
      {
        key: nextKey(),
        name: "",
        detail: "",
        bed: "double",
        priceInr: 0,
        priceUnit: "per night",
        mediaId: null,
        photo: null,
        media: null,
      },
    ]);
  }

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setErrors({});
    const result = await updateHeroRoomsBlock({
      items: rows.map((r) => ({
        name: r.name,
        detail: r.detail,
        bed: r.bed,
        priceInr: r.priceInr,
        priceUnit: r.priceUnit,
        mediaId: r.media?.id ?? null,
        photo: r.photo,
      })),
    });
    setSaving(false);
    if (!result?.ok) {
      setErrors(result?.fieldErrors ?? {});
      toast({ tone: "error", title: result?.error ?? "Something went wrong." });
      return;
    }
    toast({ tone: "success", title: "Saved", body: "The homepage shows the new rooms now." });
  }

  return (
    <form onSubmit={onSave} className="space-y-5" noValidate>
      <p className="text-small text-ink-muted">
        The room cards at the top of the homepage, in this order. Each Book button sends an
        enquiry naming the room and its price.
      </p>

      <datalist id="hero-room-units">
        <option value="per night" />
        <option value="per bed" />
        <option value="per person" />
      </datalist>

      <ol className="space-y-4">
        {rows.map((room, i) => {
          const err = (field: string) => errors[`items.${i}.${field}`];
          return (
            <li key={room.key} className="rounded-md border border-hairline bg-canvas-sunk p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-caption font-semibold uppercase tracking-wide text-ink-faint">
                  Room {i + 1}
                </p>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => move(i, -1)}
                    disabled={i === 0}
                    className="grid size-8 place-items-center rounded-sm text-ink-faint transition-colors hover:bg-canvas hover:text-ink disabled:opacity-30"
                  >
                    <ArrowUp className="size-4" aria-hidden />
                    <span className="sr-only">Move up</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => move(i, 1)}
                    disabled={i === rows.length - 1}
                    className="grid size-8 place-items-center rounded-sm text-ink-faint transition-colors hover:bg-canvas hover:text-ink disabled:opacity-30"
                  >
                    <ArrowDown className="size-4" aria-hidden />
                    <span className="sr-only">Move down</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => remove(room.key)}
                    disabled={rows.length <= 1}
                    className="grid size-8 place-items-center rounded-sm text-ink-faint transition-colors hover:bg-danger-soft hover:text-danger disabled:opacity-30"
                  >
                    <Trash2 className="size-4" aria-hidden />
                    <span className="sr-only">Remove this room</span>
                  </button>
                </div>
              </div>

              <div className="mt-3 grid gap-4 sm:grid-cols-[minmax(0,13rem)_1fr]">
                <Field
                  label="Photo"
                  hint={!room.media && room.photo ? "Upload one to replace the poster photo." : undefined}
                >
                  <div className="space-y-3">
                    {!room.media && room.photo && (
                      <div className="relative aspect-[4/3] max-w-xs overflow-hidden rounded-md border border-hairline">
                        <Image src={room.photo} alt="" fill sizes="208px" className="object-cover" />
                        <button
                          type="button"
                          onClick={() => update(room.key, { photo: null })}
                          className="absolute top-1.5 right-1.5 grid size-7 place-items-center rounded-full bg-granite-950/70 text-white transition-colors hover:bg-danger"
                        >
                          <X className="size-4" aria-hidden />
                          <span className="sr-only">Remove poster photo</span>
                        </button>
                      </div>
                    )}
                    <ImageUploader
                      folder="hotels"
                      items={room.media ? [room.media] : []}
                      onChange={(items) => update(room.key, { media: items[0] ?? null })}
                      max={1}
                    />
                  </div>
                </Field>

                <div className="grid content-start gap-4 sm:grid-cols-2">
                  <Field label="Room name" required error={err("name")} className="sm:col-span-2">
                    <Input
                      value={room.name}
                      onChange={(e) => update(room.key, { name: e.target.value })}
                      placeholder="Super Deluxe Room"
                    />
                  </Field>
                  <Field label="Short line" error={err("detail")}>
                    <Input
                      value={room.detail}
                      onChange={(e) => update(room.key, { detail: e.target.value })}
                      placeholder="Double bed, balcony"
                    />
                  </Field>
                  <Field label="Icon">
                    <Select
                      value={room.bed}
                      onChange={(e) => update(room.key, { bed: e.target.value as HeroRoomItem["bed"] })}
                    >
                      <option value="double">Double bed</option>
                      <option value="single">Single or bunk bed</option>
                    </Select>
                  </Field>
                  <Field label="Price (₹)" required error={err("priceInr")}>
                    <Input
                      type="number"
                      min="0"
                      inputMode="numeric"
                      value={room.priceInr}
                      onChange={(e) => update(room.key, { priceInr: Number(e.target.value) })}
                    />
                  </Field>
                  <Field label="Price is" required error={err("priceUnit")}>
                    <Input
                      list="hero-room-units"
                      value={room.priceUnit}
                      onChange={(e) => update(room.key, { priceUnit: e.target.value })}
                      placeholder="per night"
                    />
                  </Field>
                </div>
              </div>
            </li>
          );
        })}
      </ol>

      {errors.items && <p className="text-small text-danger">{errors.items}</p>}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button type="button" variant="outline" size="sm" onClick={add} disabled={rows.length >= HERO_ROOMS_MAX}>
          <Plus className="size-4" aria-hidden /> Add a room
        </Button>
        <Button type="submit" loading={saving} loadingLabel="Saving">
          <Save className="size-4" aria-hidden /> Save rooms
        </Button>
      </div>
    </form>
  );
}
