"use client";

import { Package as PackageIcon } from "lucide-react";
import { EntityList, type EntityColumn } from "@/components/admin/entity-list";
import { deletePackage, movePackage, setPackagePublished } from "@/app/actions/packages";
import { formatINR } from "@/lib/format";
import type { Package } from "@/db/schema";

const columns: EntityColumn<Package>[] = [
  { header: "Type", cell: (r) => r.category ?? "—" },
  { header: "Duration", cell: (r) => r.durationLabel ?? "—" },
  { header: "From", align: "right", cell: (r) => formatINR(r.priceInr) },
];

export function PackageList({ items }: { items: Package[] }) {
  return (
    <EntityList
      items={items}
      columns={columns}
      noun="package"
      nounPlural="packages"
      basePath="/admin/packages"
      viewPrefix="/packages"
      icon={<PackageIcon />}
      actions={{ remove: deletePackage, setPublished: setPackagePublished, move: movePackage }}
    />
  );
}
