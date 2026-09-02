import type { Metadata } from "next";
import { listBungeeBrands } from "@/lib/admin-data";
import { AdventureForm } from "@/components/admin/adventure-form";

export const metadata: Metadata = { title: "Add a jump", robots: { index: false, follow: false } };

export default async function NewBungeePage() {
  const knownBrands = await listBungeeBrands();
  return <AdventureForm kind="bungee" coverMedia={null} knownBrands={knownBrands} />;
}
