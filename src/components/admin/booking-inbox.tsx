"use client";

import * as React from "react";
import { Download, MessageCircle, StickyNote } from "lucide-react";
import {
  Button,
  Chip,
  Field,
  Modal,
  Table,
  TableScroller,
  Td,
  Textarea,
  Th,
  Tr,
  useToast,
} from "@/components/ui";
import { cn } from "@/lib/utils";
import {
  formatDateIST,
  formatDateTimeIST,
  formatINR,
  formatPhoneIN,
  whatsappHref,
} from "@/lib/format";
import { setEnquiryNote, setEnquiryStatus } from "@/app/actions/bookings";
import type { Enquiry } from "@/db/schema";
import type { EnquiryStatus } from "@/lib/admin-data";

const STATUS_LABEL: Record<EnquiryStatus, string> = {
  new: "New",
  contacted: "Contacted",
  confirmed: "Confirmed",
  completed: "Completed",
  lost: "Lost",
};

const STATUS_ORDER: EnquiryStatus[] = ["new", "contacted", "confirmed", "completed", "lost"];

function waMessage(row: Enquiry): string {
  return (
    `Hi ${row.name}, this is Ganga Vedha regarding your enquiry (${row.refCode}) ` +
    `for ${row.productNameSnapshot}${row.travelDate ? ` on ${formatDateIST(row.travelDate)}` : ""}. ` +
    `Let's get it confirmed!`
  );
}

function toCsv(rows: Enquiry[]): string {
  const header = [
    "Ref",
    "Date",
    "Name",
    "Phone",
    "Product",
    "Price",
    "Travel date",
    "Group size",
    "Status",
    "Source",
    "Message",
  ];
  const escape = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const lines = rows.map((r) =>
    [
      r.refCode,
      formatDateTimeIST(r.createdAt),
      r.name,
      formatPhoneIN(r.phone),
      r.productNameSnapshot,
      r.productPriceSnapshotInr ?? "",
      r.travelDate ?? "",
      r.groupSize ?? "",
      STATUS_LABEL[r.status],
      r.source,
      r.message ?? "",
    ]
      .map(escape)
      .join(","),
  );
  return [header.map(escape).join(","), ...lines].join("\n");
}

export function BookingInbox({ items }: { items: Enquiry[] }) {
  const { toast } = useToast();
  const [rows, setRows] = React.useState(items);
  const [filter, setFilter] = React.useState<EnquiryStatus | "all">("all");
  const [noteRow, setNoteRow] = React.useState<Enquiry | null>(null);

  const filtered = filter === "all" ? rows : rows.filter((r) => r.status === filter);

  async function updateStatus(id: number, status: EnquiryStatus) {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
    await setEnquiryStatus(id, status);
    toast({ tone: "success", title: `Marked ${STATUS_LABEL[status].toLowerCase()}` });
  }

  function exportCsv() {
    const blob = new Blob([toCsv(filtered)], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ganga-vedha-bookings-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setFilter("all")}
            className={cn(
              "h-9 rounded-full px-3.5 text-small font-semibold transition-colors",
              filter === "all" ? "bg-jade-700 text-white" : "bg-granite-100 text-ink-muted hover:text-ink",
            )}
          >
            All ({rows.length})
          </button>
          {STATUS_ORDER.map((s) => {
            const count = rows.filter((r) => r.status === s).length;
            return (
              <button
                key={s}
                type="button"
                onClick={() => setFilter(s)}
                className={cn(
                  "h-9 rounded-full px-3.5 text-small font-semibold transition-colors",
                  filter === s ? "bg-jade-700 text-white" : "bg-granite-100 text-ink-muted hover:text-ink",
                )}
              >
                {STATUS_LABEL[s]} ({count})
              </button>
            );
          })}
        </div>
        <button
          type="button"
          onClick={exportCsv}
          className="inline-flex h-9 items-center gap-1.5 rounded-md border border-granite-300 px-3.5 text-small font-semibold text-ink-muted transition-colors hover:border-granite-400 hover:text-ink"
        >
          <Download className="size-4" aria-hidden /> Export CSV
        </button>
      </div>

      <TableScroller label="Bookings" className="mt-5">
        <Table>
          <thead>
            <tr>
              <Th>Ref</Th>
              <Th>Received</Th>
              <Th>Guest</Th>
              <Th>Product</Th>
              <Th className="text-right">Price</Th>
              <Th>Travel date</Th>
              <Th>Status</Th>
              <Th className="text-right">Actions</Th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => {
              const wa = whatsappHref(r.phone, waMessage(r));
              return (
                <Tr key={r.id}>
                  <Td className="tabular font-semibold whitespace-nowrap">{r.refCode}</Td>
                  <Td className="whitespace-nowrap text-ink-muted">{formatDateTimeIST(r.createdAt)}</Td>
                  <Td className="whitespace-nowrap">
                    <p className="font-semibold text-ink">{r.name}</p>
                    <p className="text-caption text-ink-faint">{formatPhoneIN(r.phone)}</p>
                  </Td>
                  <Td className="max-w-48 truncate">{r.productNameSnapshot}</Td>
                  <Td className="text-right tabular">
                    {r.productPriceSnapshotInr ? formatINR(r.productPriceSnapshotInr) : "—"}
                  </Td>
                  <Td className="whitespace-nowrap tabular">
                    {r.travelDate ? formatDateIST(r.travelDate) : "Flexible"}
                    {r.groupSize && (
                      <span className="ml-1.5 text-caption text-ink-faint">· {r.groupSize} pax</span>
                    )}
                  </Td>
                  <Td>
                    {/* A compact, table-cell-scale select — the design system's
                        <Select> needs a <Field> label wrapper, which a data
                        row has no room or need for. */}
                    <select
                      aria-label={`Status for ${r.refCode}`}
                      value={r.status}
                      onChange={(e) => updateStatus(r.id, e.target.value as EnquiryStatus)}
                      className="h-9 rounded-sm border border-granite-300 bg-canvas px-2 text-caption text-ink focus:border-jade-600 focus:outline-none focus:ring-2 focus:ring-jade-600/25"
                    >
                      {STATUS_ORDER.map((s) => (
                        <option key={s} value={s}>
                          {STATUS_LABEL[s]}
                        </option>
                      ))}
                    </select>
                  </Td>
                  <Td>
                    <div className="flex items-center justify-end gap-3">
                      <button
                        type="button"
                        onClick={() => setNoteRow(r)}
                        className={cn(
                          "text-ink-faint transition-colors hover:text-ink",
                          r.adminNote && "text-jade-700",
                        )}
                        title="Note"
                      >
                        <StickyNote className="size-4" aria-hidden />
                      </button>
                      {wa ? (
                        <a
                          href={wa}
                          target="_blank"
                          rel="noopener"
                          className="inline-flex items-center gap-1.5 rounded-sm bg-[#25D366] px-2.5 py-1.5 text-caption font-semibold text-white no-underline"
                        >
                          <MessageCircle className="size-3.5" aria-hidden /> Reply
                        </a>
                      ) : (
                        <Chip tone="closed" size="sm">
                          Bad number
                        </Chip>
                      )}
                    </div>
                  </Td>
                </Tr>
              );
            })}
          </tbody>
        </Table>
      </TableScroller>

      {filtered.length === 0 && (
        <p className="mt-8 text-center text-small text-ink-muted">
          No bookings {filter === "all" ? "yet" : `in ${STATUS_LABEL[filter as EnquiryStatus].toLowerCase()}`}.
        </p>
      )}

      {noteRow && (
        <NoteModal
          row={noteRow}
          onClose={() => setNoteRow(null)}
          onSaved={(note) => {
            setRows((prev) => prev.map((r) => (r.id === noteRow.id ? { ...r, adminNote: note } : r)));
            setNoteRow(null);
          }}
        />
      )}
    </div>
  );
}

function NoteModal({
  row,
  onClose,
  onSaved,
}: {
  row: Enquiry;
  onClose: () => void;
  onSaved: (note: string) => void;
}) {
  const [note, setNote] = React.useState(row.adminNote ?? "");
  const [saving, setSaving] = React.useState(false);

  async function save() {
    setSaving(true);
    await setEnquiryNote(row.id, note);
    setSaving(false);
    onSaved(note);
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={`Note for ${row.refCode}`}
      description={row.message ? `Visitor's message: "${row.message}"` : undefined}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={save} loading={saving} loadingLabel="Saving">
            Save note
          </Button>
        </>
      }
    >
      <Field label="Note">
        <Textarea
          rows={4}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Anything worth remembering about this booking."
        />
      </Field>
    </Modal>
  );
}
