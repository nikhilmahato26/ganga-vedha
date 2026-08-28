"use client";

import * as React from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button, Field, Input } from "@/components/ui";
import { ImageUploader } from "@/components/admin/uploader";
import type { RoomFormValues } from "@/lib/schemas/hotel";
import type { MediaItem } from "@/lib/media-types";

/**
 * A room being edited has no id until it is saved; the temp key keeps React's
 * list stable either way. `media` carries the room photo's displayable asset
 * (url, alt text) alongside the plain `mediaId` the form actually submits —
 * the id alone isn't enough for the uploader to render a preview.
 */
type EditableRoom = RoomFormValues & { key: string; media: MediaItem | null };

/** What the server hands in for an existing room: form fields plus its resolved photo, if any. */
export type RoomEditorValue = RoomFormValues & { media: MediaItem | null };

let tempKeySeq = 0;
function withKeys(rooms: RoomEditorValue[]): EditableRoom[] {
  return rooms.map((r) => ({ ...r, key: r.id ? `id-${r.id}` : `tmp-${tempKeySeq++}` }));
}

export function RoomEditor({
  value,
  onChange,
}: {
  value: RoomEditorValue[];
  onChange: (next: RoomFormValues[]) => void;
}) {
  const [rows, setRows] = React.useState<EditableRoom[]>(() => withKeys(value));

  function commit(next: EditableRoom[]) {
    setRows(next);
    onChange(
      next.map((r) => ({
        id: r.id,
        name: r.name,
        occupancy: r.occupancy,
        bedType: r.bedType,
        pricePerNightInr: r.pricePerNightInr,
        inclusions: r.inclusions,
        mediaId: r.media?.id ?? null,
      })),
    );
  }

  function update(key: string, patch: Partial<EditableRoom>) {
    commit(rows.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  }
  function remove(key: string) {
    commit(rows.filter((r) => r.key !== key));
  }
  function add() {
    commit([
      ...rows,
      {
        key: `tmp-${tempKeySeq++}`,
        name: "",
        occupancy: 2,
        bedType: "",
        pricePerNightInr: 0,
        inclusions: [],
        mediaId: null,
        media: null,
      },
    ]);
  }

  return (
    <div className="space-y-4">
      {rows.map((room) => (
        <div key={room.key} className="rounded-md border border-hairline bg-canvas-sunk p-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Room photo" className="sm:col-span-2">
              <ImageUploader
                folder="hotels"
                items={room.media ? [room.media] : []}
                onChange={(items) => update(room.key, { media: items[0] ?? null })}
                max={1}
              />
            </Field>
            <Field label="Room name" required>
              <Input
                value={room.name}
                onChange={(e) => update(room.key, { name: e.target.value })}
                placeholder="Twin-share Swiss tent"
              />
            </Field>
            <Field label="Bed type">
              <Input
                value={room.bedType ?? ""}
                onChange={(e) => update(room.key, { bedType: e.target.value })}
                placeholder="Two single beds"
              />
            </Field>
            <Field label="Sleeps">
              <Input
                type="number"
                min="1"
                value={room.occupancy}
                onChange={(e) => update(room.key, { occupancy: Number(e.target.value) })}
              />
            </Field>
            <Field label="Price per night (₹)" required>
              <Input
                type="number"
                min="0"
                value={room.pricePerNightInr}
                onChange={(e) => update(room.key, { pricePerNightInr: Number(e.target.value) })}
              />
            </Field>
            <Field label="What's included" className="sm:col-span-2" hint="One item per line.">
              <textarea
                value={room.inclusions.join("\n")}
                onChange={(e) =>
                  update(room.key, {
                    inclusions: e.target.value.split("\n").map((l) => l.trim()).filter(Boolean),
                  })
                }
                rows={2}
                className="w-full rounded-sm border border-granite-300 bg-canvas px-3 py-2 text-small text-ink placeholder:text-ink-faint focus:border-jade-600 focus:outline-none focus:ring-2 focus:ring-jade-600/25"
              />
            </Field>
          </div>
          <button
            type="button"
            onClick={() => remove(room.key)}
            className="mt-3 inline-flex items-center gap-1.5 text-caption font-semibold text-danger"
          >
            <Trash2 className="size-3.5" aria-hidden /> Remove this room
          </button>
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" onClick={add}>
        <Plus className="size-4" aria-hidden /> Add a room type
      </Button>
    </div>
  );
}
