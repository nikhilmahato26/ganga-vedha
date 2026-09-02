"use server";

import { redirect } from "next/navigation";
import { revalidatePath, revalidateTag } from "next/cache";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { siteSettings } from "@/db/schema";
import { getVerifiedSession } from "@/lib/auth";
import { contentTags } from "@/lib/content";
import { logAudit } from "@/lib/audit";
import { settingsSchema } from "@/lib/schemas/settings";

export type SettingsActionState =
  | { ok: true }
  | { ok: false; error: string; fieldErrors?: Record<string, string> }
  | undefined;

export async function updateSettings(input: unknown): Promise<SettingsActionState> {
  const session = await getVerifiedSession();
  if (!session) redirect("/admin/login");

  const parsed = settingsSchema.safeParse(input);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? "form");
      fieldErrors[key] ??= issue.message;
    }
    return { ok: false, error: "Check the highlighted fields.", fieldErrors };
  }
  const data = parsed.data;

  await getDb()
    .update(siteSettings)
    .set({
      brandName: data.brandName,
      tagline: data.tagline,
      whatsappNumber: data.whatsappNumber,
      phone: data.phone,
      email: data.email || null,
      address: data.address,
      mapUrl: data.mapUrl || null,
      heroHeading: data.heroHeading,
      heroSubheading: data.heroSubheading,
      heroMediaId: data.heroMediaId,
      announcement: data.announcement,
      announcementActive: data.announcementActive,
      riverStatusLabel: data.riverStatusLabel,
      gaugeLocation: data.gaugeLocation,
    })
    .where(eq(siteSettings.id, 1));

  revalidateTag(contentTags.settings);
  revalidatePath("/");
  revalidatePath("/rafting");
  revalidatePath("/hotels");
  await logAudit(session, { action: "update", entityType: "settings", label: "Site settings" });
  return { ok: true };
}
