import type { Metadata } from "next";
import { listActivitiesAdmin } from "@/lib/admin-data";
import { AdventureList } from "@/components/admin/adventure-list";

export const metadata: Metadata = {
  title: "Adventures",
  robots: { index: false, follow: false },
};

export default async function ActivitiesAdminPage() {
  const items = await listActivitiesAdmin();
  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="text-display-md text-ink">Other adventures</h1>
      <p className="mt-2 text-ink-muted">
        Paragliding, zip-lining and anything else that isn&rsquo;t rafting or the bungee jump. Shows on
        the <code>/adventures</code> page. Order here sets the order on the site.
      </p>
      <div className="mt-8">
        <AdventureList kind="activities" items={items} />
      </div>
    </div>
  );
}
