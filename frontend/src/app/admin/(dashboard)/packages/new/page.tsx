import type { Metadata } from "@/components/seo";
import { listDestinationOptions } from "@/lib/admin-data";
import { PackageForm } from "@/components/admin/package-form";
import { useLoaderData } from "react-router-dom";

const metadata: Metadata = { title: "Add a package", robots: { index: false, follow: false } };

export async function loader() {
  const destinationOptions = await listDestinationOptions();
  return { destinationOptions, metadata };
}

export default function NewPackagePage() {
  const { destinationOptions } = useLoaderData<typeof loader>();
  return <PackageForm coverMedia={null} destinationOptions={destinationOptions} />;
}
