import type { Metadata } from "next";
import { DestinationForm } from "@/components/admin/destination-form";

export const metadata: Metadata = {
  title: "Add a destination",
  robots: { index: false, follow: false },
};

export default function NewDestinationPage() {
  return <DestinationForm coverMedia={null} />;
}
