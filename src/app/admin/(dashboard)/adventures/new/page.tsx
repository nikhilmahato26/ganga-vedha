import type { Metadata } from "next";
import { AdventureForm } from "@/components/admin/adventure-form";

export const metadata: Metadata = {
  title: "Add an adventure",
  robots: { index: false, follow: false },
};

export default function NewActivityPage() {
  return <AdventureForm kind="paragliding" coverMedia={null} />;
}
