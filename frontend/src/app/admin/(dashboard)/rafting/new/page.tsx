import type { Metadata } from "@/components/seo";
import { AdventureForm } from "@/components/admin/adventure-form";

const metadata: Metadata = { title: "Add a stretch", robots: { index: false, follow: false } };

export function loader() {
  return { metadata };
}

export default function NewRaftingPage() {
  return <AdventureForm kind="rafting" coverMedia={null} />;
}
