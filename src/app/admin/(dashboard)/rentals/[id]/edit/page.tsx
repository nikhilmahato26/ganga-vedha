import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getMediaById, getRentalAdmin } from "@/lib/admin-data";
import { RentalForm } from "@/components/admin/rental-form";

export const metadata: Metadata = { title: "Edit rental", robots: { index: false, follow: false } };

export default async function EditRentalPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const rental = await getRentalAdmin(Number(id));
  if (!rental) notFound();
  const media = await getMediaById(rental.coverMediaId);

  return (
    <RentalForm
      rental={rental}
      coverMedia={
        media ? { id: media.id, secureUrl: media.secureUrl, altText: media.altText ?? "" } : null
      }
    />
  );
}
