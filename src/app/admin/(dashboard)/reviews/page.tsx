import type { Metadata } from "next";
import { listReviewsAdmin } from "@/lib/admin-data";
import { ReviewList } from "@/components/admin/review-list";

export const metadata: Metadata = { title: "Reviews", robots: { index: false, follow: false } };

export default async function ReviewsAdminPage() {
  const items = await listReviewsAdmin();
  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="text-display-md text-ink">Reviews</h1>
      <p className="mt-2 text-ink-muted">Real guest feedback shown on the landing page.</p>
      <div className="mt-8">
        <ReviewList items={items} />
      </div>
    </div>
  );
}
