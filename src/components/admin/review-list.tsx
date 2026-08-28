"use client";

import * as React from "react";
import { ArrowDown, ArrowUp, Pencil, Plus, Star, Trash2 } from "lucide-react";
import {
  Button,
  Card,
  CardBody,
  EmptyState,
  Field,
  Input,
  Modal,
  Rating,
  Select,
  Switch,
  Textarea,
  useToast,
} from "@/components/ui";
import {
  createReview,
  deleteReview,
  moveReview,
  setReviewPublished,
  updateReview,
} from "@/app/actions/reviews";
import type { Review } from "@/db/schema";

type Draft = {
  id: number | null;
  authorName: string;
  rating: number;
  body: string;
  tripLabel: string;
  isPublished: boolean;
};

const EMPTY_DRAFT: Draft = {
  id: null,
  authorName: "",
  rating: 5,
  body: "",
  tripLabel: "",
  isPublished: true,
};

export function ReviewList({ items }: { items: Review[] }) {
  const { toast } = useToast();
  const [rows, setRows] = React.useState(items);
  const [pending, setPending] = React.useState<number | null>(null);
  const [open, setOpen] = React.useState(false);
  const [draft, setDraft] = React.useState<Draft>(EMPTY_DRAFT);
  const [saving, setSaving] = React.useState(false);
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  function openNew() {
    setDraft(EMPTY_DRAFT);
    setErrors({});
    setOpen(true);
  }
  function openEdit(r: Review) {
    setDraft({
      id: r.id,
      authorName: r.authorName,
      rating: r.rating,
      body: r.body,
      tripLabel: r.tripLabel ?? "",
      isPublished: r.isPublished,
    });
    setErrors({});
    setOpen(true);
  }

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const payload = {
      authorName: draft.authorName,
      rating: draft.rating,
      body: draft.body,
      tripLabel: draft.tripLabel || null,
      isPublished: draft.isPublished,
    };
    const result = draft.id ? await updateReview(draft.id, payload) : await createReview(payload);
    setSaving(false);
    if (!result?.ok) {
      setErrors(result?.fieldErrors ?? {});
      toast({ tone: "error", title: result?.error ?? "Something went wrong." });
      return;
    }
    toast({ tone: "success", title: draft.id ? "Saved" : "Added" });
    setOpen(false);
    setRows((prev) => {
      if (draft.id) {
        return prev.map((r) =>
          r.id === draft.id
            ? { ...r, authorName: draft.authorName, rating: draft.rating, body: draft.body, tripLabel: draft.tripLabel || null, isPublished: draft.isPublished }
            : r,
        );
      }
      return [
        ...prev,
        {
          id: result.id,
          authorName: draft.authorName,
          rating: draft.rating,
          body: draft.body,
          tripLabel: draft.tripLabel || null,
          isPublished: draft.isPublished,
          source: "manual",
          avatarMediaId: null,
          sortOrder: prev.length,
          createdAt: new Date(),
        },
      ];
    });
  }

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
    await moveReview(id, direction);
    setPending(null);
  }

  async function handleToggle(id: number, isPublished: boolean) {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, isPublished } : r)));
    await setReviewPublished(id, isPublished);
  }

  async function handleDelete(id: number, name: string) {
    if (!confirm(`Delete the review from "${name}"?`)) return;
    setPending(id);
    setRows((prev) => prev.filter((r) => r.id !== id));
    await deleteReview(id);
    setPending(null);
  }

  return (
    <div>
      <div className="flex justify-end">
        <Button size="sm" onClick={openNew}>
          <Plus className="size-4" aria-hidden /> Add review
        </Button>
      </div>

      {rows.length === 0 ? (
        <EmptyState
          className="mt-6"
          icon={<Star />}
          title="No reviews yet"
          description="Add real guest feedback and it appears in the reviews section once published."
          action={<Button size="sm" onClick={openNew}>Add review</Button>}
        />
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {rows.map((r, i) => (
            <Card key={r.id} elevation="flat">
              <CardBody className="flex flex-col gap-3 p-5">
                <div className="flex items-start justify-between gap-2">
                  <Rating value={r.rating} />
                  <Switch
                    label=""
                    checked={r.isPublished}
                    onChange={(e) => handleToggle(r.id, e.target.checked)}
                    disabled={pending === r.id}
                  />
                </div>
                <p className="flex-1 text-small text-ink-muted">&ldquo;{r.body}&rdquo;</p>
                <div className="flex items-end justify-between gap-2 border-t border-hairline pt-3">
                  <div>
                    <p className="text-small font-semibold text-ink">{r.authorName}</p>
                    {r.tripLabel && <p className="text-caption text-ink-faint">{r.tripLabel}</p>}
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      disabled={i === 0}
                      onClick={() => handleMove(r.id, "up")}
                      className="grid size-8 place-items-center rounded-sm text-ink-faint hover:bg-granite-100 hover:text-ink disabled:opacity-30"
                    >
                      <ArrowUp className="size-4" aria-hidden />
                    </button>
                    <button
                      type="button"
                      disabled={i === rows.length - 1}
                      onClick={() => handleMove(r.id, "down")}
                      className="grid size-8 place-items-center rounded-sm text-ink-faint hover:bg-granite-100 hover:text-ink disabled:opacity-30"
                    >
                      <ArrowDown className="size-4" aria-hidden />
                    </button>
                    <button
                      type="button"
                      onClick={() => openEdit(r)}
                      className="grid size-8 place-items-center rounded-sm text-ink-faint hover:bg-granite-100 hover:text-ink"
                    >
                      <Pencil className="size-4" aria-hidden />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(r.id, r.authorName)}
                      className="grid size-8 place-items-center rounded-sm text-ink-faint hover:bg-danger-soft hover:text-danger"
                    >
                      <Trash2 className="size-4" aria-hidden />
                    </button>
                  </div>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={draft.id ? "Edit review" : "Add review"}
        footer={
          <>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button form="review-form" type="submit" loading={saving} loadingLabel="Saving">
              {draft.id ? "Save" : "Add"}
            </Button>
          </>
        }
      >
        <form id="review-form" onSubmit={onSave} className="grid gap-4 sm:grid-cols-2" noValidate>
          <Field label="Guest name" required error={errors.authorName}>
            <Input value={draft.authorName} onChange={(e) => setDraft((d) => ({ ...d, authorName: e.target.value }))} required />
          </Field>
          <Field label="Rating">
            <Select value={draft.rating} onChange={(e) => setDraft((d) => ({ ...d, rating: Number(e.target.value) }))}>
              {[5, 4, 3, 2, 1].map((n) => (
                <option key={n} value={n}>{n} star{n > 1 ? "s" : ""}</option>
              ))}
            </Select>
          </Field>
          <Field label="Trip label" className="sm:col-span-2" hint='e.g. "16 km from Shivpuri"'>
            <Input value={draft.tripLabel} onChange={(e) => setDraft((d) => ({ ...d, tripLabel: e.target.value }))} />
          </Field>
          <Field label="Review" required error={errors.body} className="sm:col-span-2">
            <Textarea rows={4} value={draft.body} onChange={(e) => setDraft((d) => ({ ...d, body: e.target.value }))} required />
          </Field>
        </form>
      </Modal>
    </div>
  );
}
