import type { Metadata } from "next";
import { listAdventuresAdmin } from "@/lib/admin-data";
import { AdventureList } from "@/components/admin/adventure-list";

export const metadata: Metadata = { title: "Bungee", robots: { index: false, follow: false } };

export default async function BungeeAdminPage() {
  const items = await listAdventuresAdmin("bungee");
  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="text-display-md text-ink">Bungee jumps</h1>
      <p className="mt-2 text-ink-muted">
        One row per jump. Set the <strong className="font-semibold">Operator</strong> on each so the
        site groups them by brand — Himalayan Bungee, Jumpin Heights, Maa Ganga Bungee and so on.
      </p>
      <div className="mt-8">
        <AdventureList kind="bungee" items={items} />
      </div>
    </div>
  );
}
