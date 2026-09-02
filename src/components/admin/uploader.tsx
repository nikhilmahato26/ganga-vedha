"use client";

import * as React from "react";
import Image from "next/image";
import { GripVertical, ImagePlus, Loader2, Trash2, TriangleAlert, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { resizeImageFile } from "@/lib/image-resize";
import { createMediaRecord, getUploadTicket } from "@/app/actions/media";
import type { MediaItem } from "@/lib/media-types";

const MAX_BYTES_AFTER_RESIZE = 8 * 1024 * 1024; // Cloudinary free-tier default cap.

type UploadingFile = {
  key: string;
  name: string;
  progress: number; // 0–100
  error: string | null;
};

/**
 * Uploads a single already-resized blob straight to Cloudinary using a
 * server-signed, one-shot ticket. XHR rather than fetch because fetch has no
 * upload-progress event — an 8-photo batch on a riverside 4G connection needs
 * visible progress, not a spinner that could be hung or could be fine.
 */
function uploadToCloudinary(
  ticket: Awaited<ReturnType<typeof getUploadTicket>>,
  blob: Blob,
  filename: string,
  onProgress: (pct: number) => void,
): Promise<{ public_id: string; secure_url: string; width: number; height: number; format: string; bytes: number }> {
  return new Promise((resolve, reject) => {
    const form = new FormData();
    form.append("file", blob, filename);
    form.append("api_key", ticket.apiKey);
    form.append("timestamp", String(ticket.timestamp));
    form.append("signature", ticket.signature);
    form.append("folder", ticket.folder);

    const xhr = new XMLHttpRequest();
    xhr.open("POST", `https://api.cloudinary.com/v1_1/${ticket.cloudName}/image/upload`);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(JSON.parse(xhr.responseText));
      } else {
        const message = (() => {
          try {
            return JSON.parse(xhr.responseText)?.error?.message;
          } catch {
            return null;
          }
        })();
        reject(new Error(message || `Upload failed (${xhr.status}).`));
      }
    };
    xhr.onerror = () => reject(new Error("Network error during upload."));
    xhr.send(form);
  });
}

export function ImageUploader({
  folder,
  items,
  onChange,
  max = 12,
}: {
  folder:
    | "adventures"
    | "hotels"
    | "reviews"
    | "site"
    | "packages"
    | "rentals"
    | "destinations"
    | "hero"
    | "promotions";
  items: MediaItem[];
  onChange: (items: MediaItem[]) => void;
  /** 1 for a single cover image; higher for a gallery. */
  max?: number;
}) {
  const [uploading, setUploading] = React.useState<UploadingFile[]>([]);
  const [dragOver, setDragOver] = React.useState(false);
  const [dragFromIndex, setDragFromIndex] = React.useState<number | null>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  // `items` is a prop, so it only reflects the last `onChange` the parent has
  // re-rendered with. A batch of N files uploads concurrently-ish (each await
  // yields), so by upload 2's turn the prop is still whatever it was when this
  // function was called — appending to it drops every upload before it. This
  // ref tracks what onChange has actually been told, updated synchronously as
  // each upload finishes, so a multi-file batch accumulates correctly.
  const itemsRef = React.useRef(items);
  React.useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  const remainingSlots = max - items.length;

  async function processFiles(files: FileList | File[]) {
    const list = [...files].filter((f) => f.type.startsWith("image/")).slice(0, remainingSlots);
    if (list.length === 0) return;

    const jobs = list.map((f) => ({ key: `${f.name}-${f.size}-${Date.now()}`, file: f }));
    setUploading((prev) => [
      ...prev,
      ...jobs.map((j) => ({ key: j.key, name: j.file.name, progress: 0, error: null })),
    ]);

    for (const { key, file } of jobs) {
      try {
        const { blob, width, height } = await resizeImageFile(file);
        if (blob.size > MAX_BYTES_AFTER_RESIZE) {
          throw new Error("Still too large after resizing — try a smaller photo.");
        }
        const ticket = await getUploadTicket({ folder });
        const result = await uploadToCloudinary(ticket, blob, file.name, (pct) =>
          setUploading((prev) => prev.map((u) => (u.key === key ? { ...u, progress: pct } : u))),
        );

        const record = await createMediaRecord({
          publicId: result.public_id,
          secureUrl: result.secure_url,
          width: result.width ?? width ?? null,
          height: result.height ?? height ?? null,
          format: result.format ?? null,
          bytes: result.bytes ?? blob.size,
          folder: ticket.folder,
          altText: "",
        });

        const next = [...itemsRef.current, { id: record.id, secureUrl: record.secureUrl, altText: record.altText ?? "" }];
        itemsRef.current = next;
        onChange(next);
        setUploading((prev) => prev.filter((u) => u.key !== key));
      } catch (err) {
        setUploading((prev) =>
          prev.map((u) =>
            u.key === key
              ? { ...u, error: err instanceof Error ? err.message : "Upload failed." }
              : u,
          ),
        );
      }
    }
  }

  function removeAt(index: number) {
    onChange(items.filter((_, i) => i !== index));
  }

  function setAlt(index: number, altText: string) {
    onChange(items.map((it, i) => (i === index ? { ...it, altText } : it)));
  }

  function reorder(from: number, to: number) {
    if (from === to) return;
    const next = [...items];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    onChange(next);
  }

  return (
    <div className="space-y-3">
      {items.length > 0 && (
        <ul
          className={cn(
            "grid gap-3",
            max === 1 ? "grid-cols-1 max-w-xs" : "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4",
          )}
        >
          {items.map((item, i) => (
            <li
              key={item.id}
              draggable={items.length > 1}
              onDragStart={() => setDragFromIndex(i)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                if (dragFromIndex !== null) reorder(dragFromIndex, i);
                setDragFromIndex(null);
              }}
              className={cn(
                "group relative overflow-hidden rounded-md border border-hairline bg-canvas-sunk",
                items.length > 1 && "cursor-grab active:cursor-grabbing",
              )}
            >
              <div className="relative aspect-[4/3]">
                <Image
                  src={item.secureUrl}
                  alt={item.altText || ""}
                  fill
                  sizes="200px"
                  className="object-cover"
                />
                {items.length > 1 && (
                  <span className="absolute top-1.5 left-1.5 grid size-6 place-items-center rounded-sm bg-granite-950/60 text-white opacity-0 transition-opacity group-hover:opacity-100">
                    <GripVertical className="size-3.5" aria-hidden />
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => removeAt(i)}
                  className="absolute top-1.5 right-1.5 grid size-7 place-items-center rounded-full bg-granite-950/70 text-white transition-colors hover:bg-danger"
                >
                  <X className="size-4" aria-hidden />
                  <span className="sr-only">Remove image</span>
                </button>
              </div>
              <input
                value={item.altText}
                onChange={(e) => setAlt(i, e.target.value)}
                placeholder="Describe this photo"
                className="w-full border-t border-hairline bg-canvas px-2.5 py-2 text-caption text-ink placeholder:text-ink-faint focus:outline-none"
              />
            </li>
          ))}
        </ul>
      )}

      {uploading.length > 0 && (
        <ul className="space-y-2">
          {uploading.map((u) => (
            <li
              key={u.key}
              className={cn(
                "flex items-center gap-3 rounded-md border px-3 py-2.5 text-small",
                u.error ? "border-danger/30 bg-danger-soft" : "border-hairline bg-canvas-sunk",
              )}
            >
              {u.error ? (
                <TriangleAlert className="size-4 shrink-0 text-danger" aria-hidden />
              ) : (
                <Loader2 className="size-4 shrink-0 animate-spin text-jade-600" aria-hidden />
              )}
              <span className="min-w-0 flex-1 truncate">{u.name}</span>
              {u.error ? (
                <span className="text-danger">{u.error}</span>
              ) : (
                <span className="tabular text-ink-faint">{u.progress}%</span>
              )}
            </li>
          ))}
        </ul>
      )}

      {remainingSlots > 0 && (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            if (e.dataTransfer.files.length) void processFiles(e.dataTransfer.files);
          }}
          onClick={() => inputRef.current?.click()}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
          }}
          className={cn(
            "flex min-h-24 cursor-pointer flex-col items-center justify-center gap-2 rounded-md border-2 border-dashed px-4 py-6 text-center transition-colors",
            dragOver ? "border-jade-500 bg-jade-50" : "border-granite-300 hover:border-granite-400",
          )}
        >
          <ImagePlus className="size-6 text-ink-faint" aria-hidden />
          <p className="text-small text-ink-muted">
            <span className="font-semibold text-link">Choose photos</span> or drag them here
          </p>
          <p className="text-caption text-ink-faint">
            {max === 1 ? "One image" : `Up to ${remainingSlots} more`} · resized automatically
          </p>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            multiple={max > 1}
            className="sr-only"
            onChange={(e) => {
              if (e.target.files) void processFiles(e.target.files);
              e.target.value = "";
            }}
          />
        </div>
      )}
    </div>
  );
}

export function DeleteMediaButton({ onConfirm }: { onConfirm: () => void }) {
  return (
    <button
      type="button"
      onClick={onConfirm}
      className="inline-flex items-center gap-1.5 text-caption font-semibold text-danger"
    >
      <Trash2 className="size-3.5" aria-hidden /> Delete
    </button>
  );
}
