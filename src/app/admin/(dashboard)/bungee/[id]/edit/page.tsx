import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getAdventureAdmin, getMediaById, listBungeeBrands } from "@/lib/admin-data";
import { AdventureForm } from "@/components/admin/adventure-form";

export const metadata: Metadata = { title: "Edit jump", robots: { index: false, follow: false } };

export default async function EditBungeePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const adventure = await getAdventureAdmin(Number(id));
  if (!adventure || adventure.kind !== "bungee") notFound();
  const [media, knownBrands] = await Promise.all([
    getMediaById(adventure.coverMediaId),
    listBungeeBrands(),
  ]);

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
