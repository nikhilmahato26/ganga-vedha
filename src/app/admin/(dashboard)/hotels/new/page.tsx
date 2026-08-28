import type { Metadata } from "next";
import { HotelForm } from "@/components/admin/hotel-form";

export const metadata: Metadata = { title: "Add a hotel", robots: { index: false, follow: false } };

export default function NewHotelPage() {
  return <HotelForm rooms={[]} coverMedia={null} gallery={[]} />;
}
