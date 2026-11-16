import type { Metadata } from "@/components/seo";
import { listAdventuresAdmin } from "@/lib/admin-data";
import { AdventureList } from "@/components/admin/adventure-list";
import { useLoaderData } from "react-router-dom";

const metadata: Metadata = { title: "Rafting", robots: { index: false, follow: false } };

export async function loader() {
  const items = await listAdventuresAdmin("rafting");
  return { items, metadata };
}

export default function RaftingAdminPage() {
  const { items } = useLoaderData<typeof loader>();
  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="text-display-md text-ink">Rafting stretches</h1>
      <p className="mt-2 text-ink-muted">Sold by the kilometre. Order here sets the order on the site.</p>
      <div className="mt-8">
        <AdventureList kind="rafting" items={items} />
      </div>
    </div>
  );
}
