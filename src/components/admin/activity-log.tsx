"use client";

import * as React from "react";
import {
  BedDouble,
  CloudRain,
  MessageSquare,
  Pencil,
  Plus,
  Settings,
  Star,
  Trash2,
  Waves,
} from "lucide-react";
import { Table, TableScroller, Td, Th, Tr } from "@/components/ui";
import { formatDateTimeIST } from "@/lib/format";
import { cn } from "@/lib/utils";

type ActivityRow = {
  id: number;
  action: string;
  entityType: string;
  entityId: number | null;
  label: string | null;
  createdAt: Date;
  adminName: string | null;
  adminEmail: string | null;
};

const ACTION_LABEL: Record<string, string> = {
  create: "Created",
  update: "Updated",
  delete: "Deleted",
  publish: "Published",
  unpublish: "Unpublished",
  reorder: "Reordered",
  status_change: "Status changed",
};

const ACTION_TONE: Record<string, string> = {
  create: "text-open",
  delete: "text-danger",
  publish: "text-open",
  unpublish: "text-caution",
  update: "text-info",
  status_change: "text-jade-700",
  reorder: "text-ink-muted",
};

const ENTITY_ICON: Record<string, typeof Waves> = {
  rafting: Waves,
  bungee: Waves,
  hotel: BedDouble,
  review: Star,
  closure: CloudRain,
  settings: Settings,
  content_block: Pencil,
  enquiry: MessageSquare,
};

export function ActivityLog({ items }: { items: ActivityRow[] }) {
  if (items.length === 0) {
    return (
      <p className="rounded-md border border-dashed border-granite-300 py-14 text-center text-small text-ink-muted">
        Nothing has been changed through the admin panel yet.
      </p>
    );
  }

  return (
    <TableScroller label="Activity">
      <Table>
        <thead>
          <tr>
            <Th>When</Th>
            <Th>Who</Th>
            <Th>What</Th>
            <Th>Item</Th>
          </tr>
        </thead>
        <tbody>
          {items.map((row) => {
            const Icon = ENTITY_ICON[row.entityType] ?? Plus;
            return (
              <Tr key={row.id}>
                <Td className="whitespace-nowrap text-ink-muted">{formatDateTimeIST(row.createdAt)}</Td>
                <Td className="whitespace-nowrap">{row.adminName ?? "—"}</Td>
                <Td className="whitespace-nowrap">
                  <span
                    className={cn(
                      "inline-flex items-center gap-1.5 font-semibold",
                      ACTION_TONE[row.action] ?? "text-ink",
                    )}
                  >
                    {row.action === "delete" ? (
                      <Trash2 className="size-3.5" aria-hidden />
                    ) : (
                      <Icon className="size-3.5" aria-hidden />
                    )}
                    {ACTION_LABEL[row.action] ?? row.action}
                  </span>
                </Td>
                <Td className="max-w-64 truncate text-ink-muted">{row.label ?? "—"}</Td>
              </Tr>
            );
          })}
        </tbody>
      </Table>
    </TableScroller>
  );
}
