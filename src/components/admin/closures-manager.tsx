"use client";

import * as React from "react";
import { Eye, Pencil, Plus, Trash2 } from "lucide-react";
import {
  Button,
  Card,
  CardBody,
  Chip,
  Field,
  Input,
  Modal,
  Select,
  Switch,
  Textarea,
  useToast,
} from "@/components/ui";
import { ClosureNoticeVisual } from "@/components/site/chrome";
import {
  createClosure,
  deleteClosure,
  setClosureActive,
  updateClosure,
} from "@/app/actions/closures";

type ClosureIcon = "rain" | "wrench" | "calendar" | "alert";
type EntityType = "adventure" | "hotel";

export type CustomClosureRow = {
  id: number;
  scope: "entity" | "global";
  entityType: EntityType | null;
  entityId: number | null;
  entityName: string | null;
  isActive: boolean;
  icon: ClosureIcon;
  title: string;
  body: string;
  footnote: string | null;
  ctaLabel: string;
};

export type ClosureTargets = {
  adventures: {
    id: number;
    name: string;
    kind: "rafting" | "bungee" | "paragliding" | "zipline";
  }[];
  hotels: { id: number; name: string }[];
};

const ICON_LABEL: Record<ClosureIcon, string> = {
  rain: "Rain (monsoon)",
  wrench: "Wrench (maintenance)",
  calendar: "Calendar (scheduled)",
  alert: "Alert (other)",
};

export function ClosuresManager({
  items,
  targets,
}: {
  items: CustomClosureRow[];
  targets: ClosureTargets;
}) {
  const { toast } = useToast();
  const [rows, setRows] = React.useState(items);
  const [editing, setEditing] = React.useState<CustomClosureRow | "new" | null>(null);
  const [previewing, setPreviewing] = React.useState<CustomClosureRow | null>(null);
  const [pendingId, setPendingId] = React.useState<number | null>(null);
  const [deletingId, setDeletingId] = React.useState<number | null>(null);

  async function toggle(row: CustomClosureRow, isActive: boolean) {
    setPendingId(row.id);
    setRows((prev) => prev.map((r) => (r.id === row.id ? { ...r, isActive } : r)));
    await setClosureActive(row.id, isActive);
    setPendingId(null);
    toast({
      tone: isActive ? "warning" : "success",
      title: isActive ? `"${row.title}" is now showing` : `"${row.title}" turned off`,
    });
  }

  async function remove(row: CustomClosureRow) {
    if (!confirm(`Delete "${row.title}"? This can't be undone.`)) return;
    setDeletingId(row.id);
    await deleteClosure(row.id);
    setRows((prev) => prev.filter((r) => r.id !== row.id));
    setDeletingId(null);
    toast({ tone: "success", title: "Closure deleted" });
  }

  return (
    <>
      <Card elevation="flat">
        <CardBody className="p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-subtitle text-ink">Closures for a specific reason</h2>
              <p className="mt-1.5 max-w-2xl text-small text-ink-muted">
                For when one listing — or the whole site — needs to say why it isn&apos;t taking
                bookings right now, separate from the three switches above. A visitor sees this
                full-screen the first time they land on the affected page.
              </p>
            </div>
            <Button size="sm" onClick={() => setEditing("new")}>
              <Plus className="size-4" aria-hidden /> Add closure
            </Button>
          </div>

          {rows.length === 0 ? (
            <p className="mt-6 rounded-md border border-dashed border-granite-300 px-4 py-8 text-center text-small text-ink-faint">
              No closures set up yet.
            </p>
          ) : (
            <div className="mt-5 divide-y divide-hairline">
              {rows.map((row) => (
                <div key={row.id} className="flex items-center justify-between gap-4 py-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-small font-semibold text-ink">{row.title}</p>
                      <Chip size="sm" tone={row.scope === "global" ? "ember" : "jade"}>
                        {row.scope === "global" ? "Whole site" : row.entityName}
                      </Chip>
                    </div>
                    <p className="mt-0.5 truncate text-caption text-ink-faint">
                      {row.isActive ? "Showing to visitors" : "Turned off"}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setPreviewing(row)}
                      className="grid size-9 place-items-center rounded-sm text-ink-faint transition-colors hover:bg-granite-100 hover:text-ink"
                      title="Preview"
                    >
                      <Eye className="size-4" aria-hidden />
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditing(row)}
                      className="grid size-9 place-items-center rounded-sm text-ink-faint transition-colors hover:bg-granite-100 hover:text-ink"
                      title="Edit"
                    >
                      <Pencil className="size-4" aria-hidden />
                    </button>
                    <button
                      type="button"
                      onClick={() => remove(row)}
                      disabled={deletingId === row.id}
                      className="grid size-9 place-items-center rounded-sm text-ink-faint transition-colors hover:bg-danger-soft hover:text-danger disabled:opacity-50"
                      title="Delete"
                    >
                      <Trash2 className="size-4" aria-hidden />
                    </button>
                    <Switch
                      label=""
                      checked={row.isActive}
                      disabled={pendingId === row.id}
                      onChange={(e) => toggle(row, e.target.checked)}
                      className="ml-1"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>

      {editing && (
        <EditClosureModal
          row={editing === "new" ? null : editing}
          targets={targets}
          onClose={() => setEditing(null)}
          onSaved={(saved) => {
            setRows((prev) => {
              const exists = prev.some((r) => r.id === saved.id);
              return exists ? prev.map((r) => (r.id === saved.id ? saved : r)) : [saved, ...prev];
            });
            setEditing(null);
          }}
        />
      )}

      {previewing && (
        <ClosureNoticeVisual
          icon={previewing.icon}
          title={previewing.title}
          body={previewing.body}
          footnote={previewing.footnote}
          ctaLabel={previewing.ctaLabel}
          onDismiss={() => setPreviewing(null)}
        />
      )}
    </>
  );
}

function EditClosureModal({
  row,
  targets,
  onClose,
  onSaved,
}: {
  row: CustomClosureRow | null;
  targets: ClosureTargets;
  onClose: () => void;
  onSaved: (row: CustomClosureRow) => void;
}) {
  const { toast } = useToast();
  const [scope, setScope] = React.useState<"entity" | "global">(row?.scope ?? "entity");
  const [entityType, setEntityType] = React.useState<EntityType>(row?.entityType ?? "adventure");
  const [entityId, setEntityId] = React.useState<string>(row?.entityId ? String(row.entityId) : "");
  const [icon, setIcon] = React.useState<ClosureIcon>(row?.icon ?? "wrench");
  const [title, setTitle] = React.useState(row?.title ?? "");
  const [body, setBody] = React.useState(row?.body ?? "");
  const [footnote, setFootnote] = React.useState(row?.footnote ?? "");
  const [ctaLabel, setCtaLabel] = React.useState(row?.ctaLabel ?? "Got it");
  const [isActive, setIsActive] = React.useState(row?.isActive ?? true);
  const [showPreview, setShowPreview] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  const targetOptions = entityType === "adventure" ? targets.adventures : targets.hotels;

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const payload = {
      scope,
      entityType: scope === "entity" ? entityType : null,
      entityId: scope === "entity" && entityId ? Number(entityId) : null,
      icon,
      title,
      body,
      footnote: footnote || null,
      ctaLabel,
      isActive,
    };
    const result = row ? await updateClosure(row.id, payload) : await createClosure(payload);
    setSaving(false);
    if (!result?.ok) {
      setErrors(result?.fieldErrors ?? {});
      toast({ tone: "error", title: result?.error ?? "Something went wrong." });
      return;
    }
    toast({ tone: "success", title: row ? "Closure updated" : "Closure created" });

    const chosenTarget = targetOptions.find((t) => String(t.id) === entityId);
    onSaved({
      id: row?.id ?? -Date.now(), // replaced by a real row on next page load; unique enough for this session's list key meanwhile
      scope,
      entityType: scope === "entity" ? entityType : null,
      entityId: scope === "entity" && entityId ? Number(entityId) : null,
      entityName: scope === "entity" ? (chosenTarget?.name ?? null) : null,
      isActive,
      icon,
      title,
      body,
      footnote: footnote || null,
      ctaLabel,
    });
  }

  return (
    <>
      <Modal
        open={!showPreview}
        onClose={onClose}
        size="lg"
        title={row ? "Edit closure" : "Add a closure"}
        description="Shown full-screen to a visitor the first time they land on the affected page while this is on."
        footer={
          <>
            <Button variant="outline" onClick={() => setShowPreview(true)}>
              <Eye className="size-4" aria-hidden /> Preview
            </Button>
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button form="custom-closure-form" type="submit" loading={saving} loadingLabel="Saving">
              Save closure
            </Button>
          </>
        }
      >
        <form id="custom-closure-form" onSubmit={onSave} className="grid gap-4 sm:grid-cols-2" noValidate>
          <div className="flex items-center justify-between gap-4 sm:col-span-2 rounded-md border border-hairline bg-canvas-sunk px-4 py-3">
            <div>
              <p className="text-small font-semibold text-ink">Show this now</p>
              <p className="text-caption text-ink-faint">Turn off any time without losing the message.</p>
            </div>
            <Switch label="" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
          </div>

          <Field label="Applies to" required>
            <Select value={scope} onChange={(e) => setScope(e.target.value as typeof scope)}>
              <option value="entity">One listing</option>
              <option value="global">The whole site</option>
            </Select>
          </Field>

          {scope === "entity" && (
            <>
              <Field label="Listing type" required>
                <Select
                  value={entityType}
                  onChange={(e) => {
                    setEntityType(e.target.value as EntityType);
                    setEntityId("");
                  }}
                >
                  <option value="adventure">Rafting or bungee</option>
                  <option value="hotel">Hotel</option>
                </Select>
              </Field>
              <Field label="Which one" required error={errors.entityId} className="sm:col-span-2">
                <Select value={entityId} onChange={(e) => setEntityId(e.target.value)}>
                  <option value="">Choose one…</option>
                  {targetOptions.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </Select>
              </Field>
            </>
          )}

          <Field label="Icon">
            <Select value={icon} onChange={(e) => setIcon(e.target.value as ClosureIcon)}>
              {Object.entries(ICON_LABEL).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Button label" required error={errors.ctaLabel}>
            <Input value={ctaLabel} onChange={(e) => setCtaLabel(e.target.value)} required />
          </Field>
          <Field label="Headline" required error={errors.title} className="sm:col-span-2">
            <Input value={title} onChange={(e) => setTitle(e.target.value)} required />
          </Field>
          <Field label="Message" required error={errors.body} className="sm:col-span-2">
            <Textarea rows={4} value={body} onChange={(e) => setBody(e.target.value)} required />
          </Field>
          <Field
            label="Footnote"
            className="sm:col-span-2"
            hint='Optional — e.g. "Back up and running from next week"'
          >
            <Input value={footnote} onChange={(e) => setFootnote(e.target.value)} />
          </Field>
        </form>
      </Modal>

      {showPreview && (
        <ClosureNoticeVisual
          icon={icon}
          title={title}
          body={body}
          footnote={footnote || null}
          ctaLabel={ctaLabel}
          onDismiss={() => setShowPreview(false)}
        />
      )}
    </>
  );
}
