import type { Metadata } from "@/components/seo";
import { notFound } from "@/lib/navigation";
import { getAdventureAdmin, getMediaById } from "@/lib/admin-data";
import { AdventureForm } from "@/components/admin/adventure-form";
import { useLoaderData, type LoaderFunctionArgs } from "react-router-dom";

const metadata: Metadata = { title: "Edit stretch", robots: { index: false, follow: false } };

export async function loader({ params: routeParams }: LoaderFunctionArgs) {
  const params = Promise.resolve(routeParams as Record<string, string> & { slug: string; id: string });
  const { id } = await params;
  const adventure = await getAdventureAdmin(Number(id));
  if (!adventure || adventure.kind !== "rafting") notFound();
  const media = await getMediaById(adventure.coverMediaId);
  return { id, adventure, media, metadata };
}

export default function EditRaftingPage() {
  const { adventure, media } = useLoaderData<typeof loader>();
  return (
    <AdventureForm
      kind="rafting"
      adventure={adventure}
      coverMedia={media ? { id: media.id, secureUrl: media.secureUrl, altText: media.altText ?? "" } : null}
    />
  );
}
