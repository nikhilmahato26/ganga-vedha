import type { Metadata } from "@/components/seo";
import { notFound } from "@/lib/navigation";
import { getMediaById, getPromotionAdmin } from "@/lib/admin-data";
import { PromotionForm } from "@/components/admin/promotion-form";
import { useLoaderData, type LoaderFunctionArgs } from "react-router-dom";

const metadata: Metadata = {
  title: "Edit promotion",
  robots: { index: false, follow: false },
};

export async function loader({ params: routeParams }: LoaderFunctionArgs) {
  const params = Promise.resolve(routeParams as Record<string, string> & { slug: string; id: string });
  const { id } = await params;
  const promotion = await getPromotionAdmin(Number(id));
  if (!promotion) notFound();
  const media = await getMediaById(promotion.mediaId);
  return { id, promotion, media, metadata };
}

export default function EditPromotionPage() {
  const { promotion, media } = useLoaderData<typeof loader>();
  return (
    <PromotionForm
      promotion={promotion}
      media={
        media ? { id: media.id, secureUrl: media.secureUrl, altText: media.altText ?? "" } : null
      }
    />
  );
}
