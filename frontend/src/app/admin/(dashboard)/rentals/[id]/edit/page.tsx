import type { Metadata } from "@/components/seo";
import { notFound } from "@/lib/navigation";
import { getMediaById, getRentalAdmin } from "@/lib/admin-data";
import { RentalForm } from "@/components/admin/rental-form";
import { useLoaderData, type LoaderFunctionArgs } from "react-router-dom";

const metadata: Metadata = { title: "Edit rental", robots: { index: false, follow: false } };

export async function loader({ params: routeParams }: LoaderFunctionArgs) {
  const params = Promise.resolve(routeParams as Record<string, string> & { slug: string; id: string });
  const { id } = await params;
  const rental = await getRentalAdmin(Number(id));
  if (!rental) notFound();
  const media = await getMediaById(rental.coverMediaId);
  return { id, rental, media, metadata };
}

export default function EditRentalPage() {
  const { rental, media } = useLoaderData<typeof loader>();
  return (
    <RentalForm
      rental={rental}
      coverMedia={
        media ? { id: media.id, secureUrl: media.secureUrl, altText: media.altText ?? "" } : null
      }
    />
  );
}
