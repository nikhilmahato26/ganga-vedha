import type { Metadata } from "@/components/seo";
import { listBungeeBrands } from "@/lib/admin-data";
import { AdventureForm } from "@/components/admin/adventure-form";
import { useLoaderData } from "react-router-dom";

const metadata: Metadata = { title: "Add a jump", robots: { index: false, follow: false } };

export async function loader() {
  const knownBrands = await listBungeeBrands();
  return { knownBrands, metadata };
}

export default function NewBungeePage() {
  const { knownBrands } = useLoaderData<typeof loader>();
  return <AdventureForm kind="bungee" coverMedia={null} knownBrands={knownBrands} />;
}
