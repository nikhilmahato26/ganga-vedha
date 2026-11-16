import type { Metadata } from "@/components/seo";
import { listPackagesAdmin } from "@/lib/admin-data";
import { PackageList } from "@/components/admin/package-list";
import { useLoaderData } from "react-router-dom";

const metadata: Metadata = { title: "Packages", robots: { index: false, follow: false } };

export async function loader() {
  const items = await listPackagesAdmin();
  return { items, metadata };
}

export default function PackagesAdminPage() {
  const { items } = useLoaderData<typeof loader>();
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
