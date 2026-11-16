import type { Metadata } from "@/components/seo";
import { listDestinationOptions } from "@/lib/admin-data";
import { HotelForm } from "@/components/admin/hotel-form";
import { useLoaderData } from "react-router-dom";

const metadata: Metadata = { title: "Add a hotel", robots: { index: false, follow: false } };

export async function loader() {
  const destinationOptions = await listDestinationOptions();
  return { destinationOptions, metadata };
}

export default function NewHotelPage() {
  const { destinationOptions } = useLoaderData<typeof loader>();
  return (
    <HotelForm rooms={[]} coverMedia={null} gallery={[]} destinationOptions={destinationOptions} />
  );
}
