import type { Metadata } from "next";
import { PromotionForm } from "@/components/admin/promotion-form";

export const metadata: Metadata = {
  title: "Add a promotion",
  robots: { index: false, follow: false },
};

export default function NewPromotionPage() {
  return <PromotionForm media={null} />;
}
