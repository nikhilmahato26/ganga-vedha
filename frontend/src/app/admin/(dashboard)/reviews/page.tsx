import type { Metadata } from "@/components/seo";
import { listReviewsAdmin } from "@/lib/admin-data";
import { ReviewList } from "@/components/admin/review-list";
import { useLoaderData } from "react-router-dom";

const metadata: Metadata = { title: "Reviews", robots: { index: false, follow: false } };

export async function loader() {
  const items = await listReviewsAdmin();
  return { items, metadata };
}

export default function ReviewsAdminPage() {
  const { items } = useLoaderData<typeof loader>();
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
