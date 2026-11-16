import type { Metadata } from "@/components/seo";
import { DestinationForm } from "@/components/admin/destination-form";

const metadata: Metadata = {
  title: "Add a destination",
  robots: { index: false, follow: false },
};

export function loader() {
  return { metadata };
}

export default function NewDestinationPage() {
  return <DestinationForm coverMedia={null} />;
}
