"use client";

import * as React from "react";
import { Eye, Pencil, Save } from "lucide-react";
import {
  Button,
  Card,
  CardBody,
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
  setServiceClosureActive,
  updateServiceClosureMessage,
  type ServiceClosure,
} from "@/app/actions/closures";

const SERVICE_LABEL = { rafting: "Rafting", bungee: "Bungee jumping", hotel: "Hotel bookings" } as const;

/**
 * The monsoon switch. Deliberately on the dashboard, not folded into
 * settings — this is the control the owner reaches for under pressure, twice
 * a year, and it has to be found in three seconds.
 */
export function ClosurePanel({ items }: { items: ServiceClosure[] }) {
  const { toast } = useToast();
  const [rows, setRows] = React.useState(items);
  const [editing, setEditing] = React.useState<ServiceClosure | null>(null);
  const [previewing, setPreviewing] = React.useState<ServiceClosure | null>(null);
  const [pending, setPending] = React.useState<string | null>(null);

  async function toggle(row: ServiceClosure, isActive: boolean) {
    setPending(row.serviceKey);
    setRows((prev) =>
      prev.map((r) => (r.serviceKey === row.serviceKey ? { ...r, isActive } : r)),
    );
    await setServiceClosureActive(row.serviceKey, isActive);
    setPending(null);
    toast({
      tone: isActive ? "warning" : "success",
      title: isActive
        ? `${SERVICE_LABEL[row.serviceKey]} bookings closed`
        : `${SERVICE_LABEL[row.serviceKey]} bookings open`,
    });
  }

  return (
    <>
      <Card elevation="flat">
        <CardBody className="p-6">
          <h2 className="text-subtitle text-ink">Bookings</h2>
          <p className="mt-1.5 text-small text-ink-muted">
            Closing a service stops new enquiries for it everywhere on the site and shows
            visitors the message below — the other two stay open.
          </p>

          <div className="mt-5 divide-y divide-hairline">
            {rows.map((row) => (
              <div key={row.serviceKey} className="flex items-center justify-between gap-4 py-4">
                <div className="min-w-0">
                  <p className="text-small font-semibold text-ink">
                    {SERVICE_LABEL[row.serviceKey]}
                  </p>
                  <p className="mt-0.5 truncate text-caption text-ink-faint">
                    {row.isActive ? row.title : "Open for bookings"}
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
                    title="Edit message"
                  >
                    <Pencil className="size-4" aria-hidden />
                  </button>
                  <Switch
                    label=""
                    checked={row.isActive}
                    disabled={pending === row.serviceKey}
                    onChange={(e) => toggle(row, e.target.checked)}
                    className="ml-1"
                  />
                </div>
              </div>
            ))}
          </div>
        </CardBody>
      </Card>

      {editing && (
        <EditClosureModal
          row={editing}
          onClose={() => setEditing(null)}
          onSaved={(updated) => {
            setRows((prev) =>
              prev.map((r) => (r.serviceKey === updated.serviceKey ? updated : r)),
            );
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
  onClose,
  onSaved,
}: {
  row: ServiceClosure;
  onClose: () => void;
  onSaved: (row: ServiceClosure) => void;
}) {
  const { toast } = useToast();
  const [icon, setIcon] = React.useState(row.icon);
  const [title, setTitle] = React.useState(row.title);
  const [body, setBody] = React.useState(row.body);
  const [footnote, setFootnote] = React.useState(row.footnote ?? "");
  const [ctaLabel, setCtaLabel] = React.useState(row.ctaLabel);
  const [showPreview, setShowPreview] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const result = await updateServiceClosureMessage(row.serviceKey, {
      icon,
      title,
      body,
      footnote: footnote || null,
      ctaLabel,
    });
    setSaving(false);
    if (!result?.ok) {
      setErrors(result?.fieldErrors ?? {});
      toast({ tone: "error", title: result?.error ?? "Something went wrong." });
      return;
    }
    toast({ tone: "success", title: "Message saved" });
    onSaved({ ...row, icon, title, body, footnote: footnote || null, ctaLabel, version: row.version + 1 });
  }

  return (
    <>
      <Modal
        open={!showPreview}
        onClose={onClose}
        size="lg"
        title={`${SERVICE_LABEL[row.serviceKey]} closure message`}
        description="Shown full-screen to a visitor the first time they land on the site while this service is closed."
        footer={
          <>
            <Button variant="outline" onClick={() => setShowPreview(true)}>
              <Eye className="size-4" aria-hidden /> Preview
            </Button>
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button form="closure-form" type="submit" loading={saving} loadingLabel="Saving">
              <Save className="size-4" aria-hidden /> Save message
            </Button>
          </>
        }
      >
        <form id="closure-form" onSubmit={onSave} className="grid gap-4 sm:grid-cols-2" noValidate>
          <Field label="Icon">
            <Select value={icon} onChange={(e) => setIcon(e.target.value as typeof icon)}>
              <option value="rain">Rain (monsoon)</option>
              <option value="wrench">Wrench (maintenance)</option>
              <option value="calendar">Calendar (scheduled)</option>
              <option value="alert">Alert (other)</option>
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
            hint='Optional — e.g. "Bookings reopen after the rains ease"'
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
