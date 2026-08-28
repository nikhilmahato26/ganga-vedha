import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getEntityGallery, getHotelAdmin, getMediaById } from "@/lib/admin-data";
import { HotelForm } from "@/components/admin/hotel-form";

export const metadata: Metadata = { title: "Edit hotel", robots: { index: false, follow: false } };

export default async function EditHotelPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const hotel = await getHotelAdmin(Number(id));
  if (!hotel) notFound();

  const [coverRow, galleryRows, roomMediaRows] = await Promise.all([
    getMediaById(hotel.coverMediaId),
    getEntityGallery("hotel", hotel.id),
    Promise.all(hotel.rooms.map((r) => getMediaById(r.mediaId))),
  ]);

  return (
    <HotelForm
      hotel={hotel}
      rooms={hotel.rooms.map((r, i) => {
        const m = roomMediaRows[i];
        return { ...r, media: m ? { id: m.id, secureUrl: m.secureUrl, altText: m.altText ?? "" } : null };
      })}
      coverMedia={
        coverRow ? { id: coverRow.id, secureUrl: coverRow.secureUrl, altText: coverRow.altText ?? "" } : null
      }
      gallery={galleryRows.map((g) => ({ id: g.id, secureUrl: g.secureUrl, altText: g.altText ?? "" }))}
    />
  );
}
