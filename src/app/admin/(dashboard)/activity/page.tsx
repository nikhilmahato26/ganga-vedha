import type { Metadata } from "next";
import { listAuditLog } from "@/lib/admin-data";
import { ActivityLog } from "@/components/admin/activity-log";

export const metadata: Metadata = { title: "Activity", robots: { index: false, follow: false } };

export default async function ActivityAdminPage() {
  const items = await listAuditLog();
  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="text-display-md text-ink">Activity</h1>
      <p className="mt-2 text-ink-muted">
        Every change made through the admin panel, newest first.
      </p>
      <div className="mt-8">
        <ActivityLog items={items} />
      </div>
    </div>
  );
}
