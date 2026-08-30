import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getAdventureAdmin, getMediaById } from "@/lib/admin-data";
import { AdventureForm } from "@/components/admin/adventure-form";

export const metadata: Metadata = {
  title: "Edit adventure",
  robots: { index: false, follow: false },
};

export default async function EditActivityPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const adventure = await getAdventureAdmin(Number(id));
  if (!adventure || (adventure.kind !== "paragliding" && adventure.kind !== "zipline")) {
    notFound();
  }
  const media = await getMediaById(adventure.coverMediaId);

  return (
    <AdventureForm
      kind={adventure.kind}
      adventure={adventure}
      coverMedia={
        media ? { id: media.id, secureUrl: media.secureUrl, altText: media.altText ?? "" } : null
      }
    />
  );
}
