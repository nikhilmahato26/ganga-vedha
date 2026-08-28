"use server";

import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { enquiries } from "@/db/schema";
import { getVerifiedSession } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import type { EnquiryStatus } from "@/lib/admin-data";

async function requireAdmin() {
  const session = await getVerifiedSession();
  if (!session) redirect("/admin/login");
  return session;
}

export async function setEnquiryStatus(id: number, status: EnquiryStatus) {
  const session = await requireAdmin();
  const [row] = await getDb()
    .update(enquiries)
    .set({
      status,
      contactedAt: status === "contacted" ? new Date() : undefined,
    })
    .where(eq(enquiries.id, id))
    .returning({ refCode: enquiries.refCode });
  if (row) {
    await logAudit(session, {
      action: "status_change",
      entityType: "enquiry",
      entityId: id,
      label: `${row.refCode} → ${status}`,
    });
  }
}

export async function setEnquiryNote(id: number, adminNote: string) {
  const session = await requireAdmin();
  const [row] = await getDb()
    .update(enquiries)
    .set({ adminNote: adminNote || null })
    .where(eq(enquiries.id, id))
    .returning({ refCode: enquiries.refCode });
  if (row) {
    await logAudit(session, {
      action: "update",
      entityType: "enquiry",
      entityId: id,
      label: `Note on ${row.refCode}`,
    });
  }
}
