import type { Metadata } from "next";
import { listPackagesAdmin } from "@/lib/admin-data";
import { PackageList } from "@/components/admin/package-list";

export const metadata: Metadata = { title: "Packages", robots: { index: false, follow: false } };

export default async function PackagesAdminPage() {
  const items = await listPackagesAdmin();
  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="text-display-md text-ink">Holiday packages</h1>
      <p className="mt-2 text-ink-muted">
        Yatras, tours and courses. Order here sets the order on the site.
      </p>
      <div className="mt-8">
        <PackageList items={items} />
      </div>
    </div>
  );
}
