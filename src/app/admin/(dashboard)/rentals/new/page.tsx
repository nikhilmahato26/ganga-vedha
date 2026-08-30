import type { Metadata } from "next";
import { RentalForm } from "@/components/admin/rental-form";

export const metadata: Metadata = { title: "Add a rental", robots: { index: false, follow: false } };

export default function NewRentalPage() {
  return <RentalForm coverMedia={null} />;
}
