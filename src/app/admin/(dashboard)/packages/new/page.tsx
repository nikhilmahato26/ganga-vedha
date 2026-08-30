import type { Metadata } from "next";
import { listDestinationOptions } from "@/lib/admin-data";
import { PackageForm } from "@/components/admin/package-form";

export const metadata: Metadata = { title: "Add a package", robots: { index: false, follow: false } };

export default async function NewPackagePage() {
  const destinationOptions = await listDestinationOptions();
  return <PackageForm coverMedia={null} destinationOptions={destinationOptions} />;
}
