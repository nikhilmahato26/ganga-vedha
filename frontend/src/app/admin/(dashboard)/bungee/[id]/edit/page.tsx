import type { Metadata } from "@/components/seo";
import { notFound } from "@/lib/navigation";
import { getAdventureAdmin, getMediaById, listBungeeBrands } from "@/lib/admin-data";
import { AdventureForm } from "@/components/admin/adventure-form";
import { useLoaderData, type LoaderFunctionArgs } from "react-router-dom";

const metadata: Metadata = { title: "Edit jump", robots: { index: false, follow: false } };

export async function loader({ params: routeParams }: LoaderFunctionArgs) {
  const params = Promise.resolve(routeParams as Record<string, string> & { slug: string; id: string });
  const { id } = await params;
  const adventure = await getAdventureAdmin(Number(id));
  if (!adventure || adventure.kind !== "bungee") notFound();
  const [media, knownBrands] = await Promise.all([
    getMediaById(adventure.coverMediaId),
    listBungeeBrands(),
  ]);
  return { id, adventure, media, knownBrands, metadata };
}

export default function EditBungeePage() {
  const { adventure, media, knownBrands } = useLoaderData<typeof loader>();
  return (
    <AdventureForm
      kind="bungee"
      adventure={adventure}
      knownBrands={knownBrands}
      coverMedia={
        media ? { id: media.id, secureUrl: media.secureUrl, altText: media.altText ?? "" } : null
      }
    />
  );
}
