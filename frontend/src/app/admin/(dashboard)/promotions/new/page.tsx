import type { Metadata } from "@/components/seo";
import { PromotionForm } from "@/components/admin/promotion-form";

const metadata: Metadata = {
  title: "Add a promotion",
  robots: { index: false, follow: false },
};

export function loader() {
  return { metadata };
}

export default function NewPromotionPage() {
  return <PromotionForm media={null} />;
}
