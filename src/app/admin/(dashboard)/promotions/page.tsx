import type { Metadata } from "next";
import { listPromotionsAdmin } from "@/lib/admin-data";
import { PromotionList } from "@/components/admin/promotion-list";

export const metadata: Metadata = {
  title: "Promotions",
  robots: { index: false, follow: false },
};

export default async function PromotionsAdminPage() {
  const items = await listPromotionsAdmin();
  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-display-md text-ink">Promotions</h1>
      <p className="mt-2 text-ink-muted">
        Small cards shown in a strip under the homepage hero — a seasonal offer, a new package, a
        rates note. Toggle one off to hide it without deleting it.
      </p>
      <div className="mt-8">
        <PromotionList items={items} />
      </div>
    </div>
  );
}
