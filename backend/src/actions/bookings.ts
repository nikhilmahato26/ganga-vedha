import type { Admin } from "../lib/auth";
import { eq } from "drizzle-orm";
import { getDb, nowIso } from "../db";
import { enquiries } from "../schema";
import { logAudit } from "../lib/audit";
import type { EnquiryStatus } from "../services/admin-data";


export async function setEnquiryStatus(admin: Admin, id: number, status: EnquiryStatus) {
  const [row] = await getDb()
    .update(enquiries)
    .set({
      status,
      contactedAt: status === "contacted" ? nowIso() : undefined,
    })
    .where(eq(enquiries.id, id))
    .returning({ refCode: enquiries.refCode });
  if (row) {
    await logAudit(admin, {
      action: "status_change",
      entityType: "enquiry",
      entityId: id,
      label: `${row.refCode} → ${status}`,
    });
  }
}

export async function setEnquiryNote(admin: Admin, id: number, adminNote: string) {
  const [row] = await getDb()
    .update(enquiries)
    .set({ adminNote: adminNote || null })
    .where(eq(enquiries.id, id))
    .returning({ refCode: enquiries.refCode });
  if (row) {
    await logAudit(admin, {
      action: "update",
      entityType: "enquiry",
      entityId: id,
      label: `Note on ${row.refCode}`,
    });
  }
}
