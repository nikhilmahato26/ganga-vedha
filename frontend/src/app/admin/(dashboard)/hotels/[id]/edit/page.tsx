import type { Metadata } from "@/components/seo";
import { notFound } from "@/lib/navigation";
import {
  getEntityGallery,
  getHotelAdmin,
  getMediaById,
  listDestinationOptions,
} from "@/lib/admin-data";
import { HotelForm } from "@/components/admin/hotel-form";
import { useLoaderData, type LoaderFunctionArgs } from "react-router-dom";

const metadata: Metadata = { title: "Edit hotel", robots: { index: false, follow: false } };

export async function loader({ params: routeParams }: LoaderFunctionArgs) {
  const params = Promise.resolve(routeParams as Record<string, string> & { slug: string; id: string });
  const { id } = await params;
  const hotel = await getHotelAdmin(Number(id));
  if (!hotel) notFound();

  const [coverRow, galleryRows, roomMediaRows, destinationOptions] = await Promise.all([
    getMediaById(hotel.coverMediaId),
    getEntityGallery("hotel", hotel.id),
    Promise.all(hotel.rooms.map((r) => getMediaById(r.mediaId))),
    listDestinationOptions(),
  ]);
  return { id, hotel, coverRow, galleryRows, roomMediaRows, destinationOptions, metadata };
}

export default function EditHotelPage() {
  const { hotel, coverRow, galleryRows, roomMediaRows, destinationOptions } = useLoaderData<typeof loader>();
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
      destinationOptions={destinationOptions}
    />
  );
}
