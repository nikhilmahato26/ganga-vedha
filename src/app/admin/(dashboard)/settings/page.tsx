import type { Metadata } from "next";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { getDb } from "@/db";
import { contentBlocks, siteSettings } from "@/db/schema";
import { Card, CardBody } from "@/components/ui";
import { PasswordForm } from "./password-form";
import { SettingsForm } from "@/components/admin/settings-form";
import { WhyUsEditor } from "@/components/admin/why-us-editor";
import type { WhyUsItem } from "@/lib/content";

export const metadata: Metadata = {
  title: "Settings",
  robots: { index: false, follow: false },
};

const WHY_US_DEFAULT_ITEMS: WhyUsItem[] = [
  {
    icon: "route",
    title: "Sold by distance, not by package name",
    body: "Every stretch has its kilometres, its put-in point, its grade and its price on the card. You are choosing a stretch of river, not a marketing tier.",
  },
  {
    icon: "radio",
    title: "We tell you when the river is shut",
    body: "The Ganga closes through the monsoon. Our booking button closes with it, and the strap at the top of this page says so every day of the year.",
  },
  {
    icon: "life-buoy",
    title: "Limits stated before you book",
    body: "Minimum age, minimum and maximum weight, and what the grade actually means. Nobody arrives at the put-in to be turned away.",
  },
  {
    icon: "sparkles",
    title: "One number, one person",
    body: "Your enquiry goes to a real WhatsApp thread with the people running the raft, not a call centre. Your details are saved either way.",
  },
];

export default async function SettingsPage() {
  const session = await getSession();
  const db = getDb();
  const [settings] = await db.select().from(siteSettings).where(eq(siteSettings.id, 1)).limit(1);
  const [whyUsRow] = await db
    .select()
    .from(contentBlocks)
    .where(eq(contentBlocks.key, "why-choose-us"))
    .limit(1);

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-display-md text-ink">Settings</h1>
      <p className="mt-2 text-ink-muted">Signed in as {session?.email}</p>

      <div className="mt-8">
        <SettingsForm settings={settings} />
      </div>

      <Card elevation="flat" className="mt-8">
        <CardBody className="p-6">
          <h2 className="text-subtitle text-ink">&ldquo;Why book with us&rdquo; section</h2>
          <div className="mt-4">
            <WhyUsEditor
              title={whyUsRow?.title ?? "Why book with us"}
              subtitle={
                whyUsRow?.subtitle ??
                "Four things we do differently, all of which you can check before you pay us anything."
              }
              items={(whyUsRow?.items as WhyUsItem[] | undefined) ?? WHY_US_DEFAULT_ITEMS}
            />
          </div>
        </CardBody>
      </Card>

      <Card elevation="flat" className="mt-8">
        <CardBody className="p-6">
          <h2 className="text-subtitle text-ink">Change password</h2>
          <p className="mt-1.5 text-small text-ink-muted">
            At least 12 characters. You&rsquo;ll stay signed in on this device.
          </p>
          <PasswordForm />
        </CardBody>
      </Card>
    </div>
  );
}
