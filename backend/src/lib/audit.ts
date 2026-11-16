import { getDb } from '../db'
import { auditLog } from '../schema'
import type { Admin } from './auth'

export type AuditAction = 'create' | 'update' | 'delete' | 'publish' | 'unpublish' | 'reorder' | 'status_change'

/**
 * A short, honest activity trail: who did what, to which entity, when. Customer phone numbers and
 * emails are never written here (AGENTS.md §05).
 */
export async function logAudit(
  admin: Admin,
  entry: { action: AuditAction; entityType: string; entityId?: number | null; label: string },
): Promise<void> {
  try {
    await getDb()
      .insert(auditLog)
      .values({ adminUserId: admin.id, action: entry.action, entityType: entry.entityType, entityId: entry.entityId ?? null, label: entry.label })
  } catch (err) {
    // Observability, not a transaction guard: a logging failure must never block the mutation.
    console.error('[audit] failed to record entry', err instanceof Error ? err.message : String(err))
  }
}
