import type { Metadata } from "@/components/seo";
import { listClosureTargets, listCustomClosuresAdmin } from "@/lib/admin-data";
import { ClosuresManager } from "@/components/admin/closures-manager";
import { useLoaderData } from "react-router-dom";

const metadata: Metadata = { title: "Closures", robots: { index: false, follow: false } };

export async function loader() {
  const [items, targets] = await Promise.all([listCustomClosuresAdmin(), listClosureTargets()]);
  return { items, targets, metadata };
}

export default function ClosuresAdminPage() {
  const { items, targets } = useLoaderData<typeof loader>();
  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="text-display-md text-ink">Closures</h1>
      <p className="mt-2 text-ink-muted">
        The Dashboard has the three big switches — all of rafting, all of bungee, all hotels.
        This is for anything narrower: one hotel closed for renovation, one rafting stretch shut
        for a landslide, or a message for the whole site.
      </p>
      <div className="mt-8">
        <ClosuresManager items={items} targets={targets} />
      </div>
    </div>
  );
}
