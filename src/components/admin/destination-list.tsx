"use client";

import { MapPin } from "lucide-react";
import { EntityList, type EntityColumn } from "@/components/admin/entity-list";
import {
  deleteDestination,
  moveDestination,
  setDestinationPublished,
} from "@/app/actions/destinations";
import type { Destination } from "@/db/schema";

const columns: EntityColumn<Destination>[] = [
  { header: "Region", cell: (r) => r.region ?? "—" },
  { header: "Tagline", cell: (r) => r.tagline ?? "—" },
];

export function DestinationList({ items }: { items: Destination[] }) {
  return (
    <EntityList
      items={items}
      columns={columns}
      noun="destination"
      nounPlural="destinations"
      basePath="/admin/destinations"
      viewPrefix="/stays"
      icon={<MapPin />}
      actions={{
        remove: deleteDestination,
        setPublished: setDestinationPublished,
        move: moveDestination,
      }}
    />
  );
}
