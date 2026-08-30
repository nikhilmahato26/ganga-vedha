"use client";

import { Car } from "lucide-react";
import { EntityList, type EntityColumn } from "@/components/admin/entity-list";
import { deleteRental, moveRental, setRentalPublished } from "@/app/actions/rentals";
import { formatINR } from "@/lib/format";
import type { Rental } from "@/db/schema";

const columns: EntityColumn<Rental>[] = [
  { header: "Kind", cell: (r) => (r.kind === "bike" ? "Bike" : "Car") },
  {
    header: "Rate",
    align: "right",
    cell: (r) => (r.quoteOnly ? "On request" : `${formatINR(r.perDayInr)}/day`),
  },
];

export function RentalList({ items }: { items: Rental[] }) {
  return (
    <EntityList
      items={items}
      columns={columns}
      noun="rental"
      nounPlural="rentals"
      basePath="/admin/rentals"
      viewPrefix="/rentals"
      icon={<Car />}
      actions={{ remove: deleteRental, setPublished: setRentalPublished, move: moveRental }}
    />
  );
}
