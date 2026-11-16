import type { Metadata } from "@/components/seo";
import { AdventureForm } from "@/components/admin/adventure-form";

const metadata: Metadata = {
  title: "Add an adventure",
  robots: { index: false, follow: false },
};

export function loader() {
  return { metadata };
}

export default function NewActivityPage() {
  return <AdventureForm kind="paragliding" coverMedia={null} />;
}
