import type { Metadata } from "@/components/seo";
import { notFound } from "@/lib/navigation";
import { getMediaById, getPackageAdmin, listDestinationOptions } from "@/lib/admin-data";
import { PackageForm } from "@/components/admin/package-form";
import { useLoaderData, type LoaderFunctionArgs } from "react-router-dom";

const metadata: Metadata = { title: "Edit package", robots: { index: false, follow: false } };

export async function loader({ params: routeParams }: LoaderFunctionArgs) {
  const params = Promise.resolve(routeParams as Record<string, string> & { slug: string; id: string });
  const { id } = await params;
  const [pkg, destinationOptions] = await Promise.all([
    getPackageAdmin(Number(id)),
    listDestinationOptions(),
  ]);
  if (!pkg) notFound();
  const media = await getMediaById(pkg.coverMediaId);
  return { id, pkg, destinationOptions, media, metadata };
}

export default function EditPackagePage() {
  const { pkg, destinationOptions, media } = useLoaderData<typeof loader>();
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
