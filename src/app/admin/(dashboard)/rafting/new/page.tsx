import type { Metadata } from "next";
import { AdventureForm } from "@/components/admin/adventure-form";

export const metadata: Metadata = { title: "Add a stretch", robots: { index: false, follow: false } };

export default function NewRaftingPage() {
  return <AdventureForm kind="rafting" coverMedia={null} />;
}
