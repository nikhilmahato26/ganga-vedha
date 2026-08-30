import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getMediaById, getPackageAdmin, listDestinationOptions } from "@/lib/admin-data";
import { PackageForm } from "@/components/admin/package-form";

export const metadata: Metadata = { title: "Edit package", robots: { index: false, follow: false } };

export default async function EditPackagePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [pkg, destinationOptions] = await Promise.all([
    getPackageAdmin(Number(id)),
    listDestinationOptions(),
  ]);
  if (!pkg) notFound();
  const media = await getMediaById(pkg.coverMediaId);

  return (
    <PackageForm
      pkg={pkg}
      destinationOptions={destinationOptions}
      coverMedia={
        media ? { id: media.id, secureUrl: media.secureUrl, altText: media.altText ?? "" } : null
      }
    />
  );
}
