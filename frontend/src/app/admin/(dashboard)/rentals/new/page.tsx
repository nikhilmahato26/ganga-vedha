import type { Metadata } from "@/components/seo";
import { RentalForm } from "@/components/admin/rental-form";

const metadata: Metadata = { title: "Add a rental", robots: { index: false, follow: false } };

export function loader() {
  return { metadata };
}

export default function NewRentalPage() {
  return <RentalForm coverMedia={null} />;
}
