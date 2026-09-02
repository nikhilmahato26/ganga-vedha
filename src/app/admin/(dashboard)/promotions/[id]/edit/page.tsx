import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getMediaById, getPromotionAdmin } from "@/lib/admin-data";
import { PromotionForm } from "@/components/admin/promotion-form";

export const metadata: Metadata = {
  title: "Edit promotion",
  robots: { index: false, follow: false },
};

export default async function EditPromotionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const promotion = await getPromotionAdmin(Number(id));
  if (!promotion) notFound();
  const media = await getMediaById(promotion.mediaId);

  return (
    <PromotionForm
      promotion={promotion}
      media={
        media ? { id: media.id, secureUrl: media.secureUrl, altText: media.altText ?? "" } : null
      }
    />
  );
}
