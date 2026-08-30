import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getDestinationAdmin, getMediaById } from "@/lib/admin-data";
import { DestinationForm } from "@/components/admin/destination-form";

export const metadata: Metadata = {
  title: "Edit destination",
  robots: { index: false, follow: false },
};

export default async function EditDestinationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const destination = await getDestinationAdmin(Number(id));
  if (!destination) notFound();
  const media = await getMediaById(destination.coverMediaId);

  return (
    <DestinationForm
      destination={destination}
      coverMedia={
        media ? { id: media.id, secureUrl: media.secureUrl, altText: media.altText ?? "" } : null
      }
    />
  );
}
