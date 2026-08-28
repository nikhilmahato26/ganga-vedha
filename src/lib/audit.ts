import "server-only";
import { getDb } from "@/db";
import { auditLog } from "@/db/schema";
import type { SessionPayload } from "@/lib/auth";

export type AuditAction =
  | "create"
  | "update"
  | "delete"
  | "publish"
  | "unpublish"
  | "reorder"
  | "status_change";

/**
 * A short, honest activity trail — who did what, to which entity, when.
 * Deliberately not a full field-by-field diff engine: that is real
 * complexity (a restore button, versioned rows) that belongs to its own
 * feature if the client ever asks for it. This answers the question that
 * actually gets asked after something changes unexpectedly: "who touched
 * this, and roughly what did they do."
 */
export async function logAudit(
  session: SessionPayload,
  entry: {
    action: AuditAction;
    entityType: string;
    entityId?: number | null;
    label: string;
  },
): Promise<void> {
  try {
    await getDb().insert(auditLog).values({
      adminUserId: Number(session.sub),
      action: entry.action,
      entityType: entry.entityType,
      entityId: entry.entityId ?? null,
      label: entry.label,
    });
  } catch (err) {
    // The audit trail is observability, not a transaction guard — a logging
    // failure must never roll back or block the mutation it is describing.
    console.error("[audit] failed to record entry", err);
  }
}
