import type { Metadata } from "@/components/seo";
import { notFound } from "@/lib/navigation";
import { getDestinationAdmin, getMediaById } from "@/lib/admin-data";
import { DestinationForm } from "@/components/admin/destination-form";
import { useLoaderData, type LoaderFunctionArgs } from "react-router-dom";

const metadata: Metadata = {
  title: "Edit destination",
  robots: { index: false, follow: false },
};

export async function loader({ params: routeParams }: LoaderFunctionArgs) {
  const params = Promise.resolve(routeParams as Record<string, string> & { slug: string; id: string });
  const { id } = await params;
  const destination = await getDestinationAdmin(Number(id));
  if (!destination) notFound();
  const media = await getMediaById(destination.coverMediaId);
  return { id, destination, media, metadata };
}

export default function EditDestinationPage() {
  const { destination, media } = useLoaderData<typeof loader>();
  return (
    <DestinationForm
      destination={destination}
      coverMedia={
        media ? { id: media.id, secureUrl: media.secureUrl, altText: media.altText ?? "" } : null
      }
    />
  );
}
