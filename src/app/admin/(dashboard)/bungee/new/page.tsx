import type { Metadata } from "next";
import { AdventureForm } from "@/components/admin/adventure-form";

export const metadata: Metadata = { title: "Add a package", robots: { index: false, follow: false } };

export default function NewBungeePage() {
  return <AdventureForm kind="bungee" coverMedia={null} />;
}
