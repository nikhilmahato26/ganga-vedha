import type { Admin } from "../lib/auth";
import type { SettingsActionState } from "../../../frontend/src/lib/action-types";
import { eq } from "drizzle-orm";
import { getDb } from "../db";
import { siteSettings } from "../schema";
import { logAudit } from "../lib/audit";
import { settingsSchema } from "../../../frontend/src/lib/schemas/settings";


export async function updateSettings(admin: Admin, input: unknown): Promise<SettingsActionState> {

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

  await logAudit(admin, { action: "update", entityType: "settings", label: "Site settings" });
  return { ok: true };
}
