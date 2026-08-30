import type { Metadata } from "next";
import { listDestinationOptions } from "@/lib/admin-data";
import { HotelForm } from "@/components/admin/hotel-form";

export const metadata: Metadata = { title: "Add a hotel", robots: { index: false, follow: false } };

export default async function NewHotelPage() {
  const destinationOptions = await listDestinationOptions();
  return (
    <HotelForm rooms={[]} coverMedia={null} gallery={[]} destinationOptions={destinationOptions} />
  );
}
