"use client";

import * as React from "react";
import Image from "next/image";
import { BedDouble, BedSingle } from "lucide-react";
import { Button, Card } from "@/components/ui";
import { EnquiryDialog, type EnquiryProduct } from "@/components/site/enquiry";
import { formatINR } from "@/lib/format";

type HeroRoom = {
  key: string;
  name: string;
  detail: string;
  /** Bunk beds are sold per bed; everything else per room. */
  bed: "double" | "single";
  priceInr: number;
  priceUnit: string;
  photo: string;
};

/**
 * The four room types and rates from the owner's own poster (October 2026).
 * Photos are cropped from that poster; swap in the originals when they arrive.
 */
const HERO_ROOMS: HeroRoom[] = [
  {
    key: "super-deluxe",
    name: "Super Deluxe Room",
    detail: "Double bed",
    bed: "double",
    priceInr: 1499,
    priceUnit: "per night",
    photo: "/rooms/deluxe-double.jpg",
  },
  {
    key: "premium-balcony",
    name: "Premium Room with Balcony",
    detail: "Double bed, balcony",
    bed: "double",
    priceInr: 1999,
    priceUnit: "per night",
    photo: "/rooms/double-bed-balcony.jpg",
  },
  {
    key: "triple-luxury",
    name: "Triple Bed Luxury Room",
    detail: "Three beds, for families",
    bed: "double",
    priceInr: 2499,
    priceUnit: "per night",
    photo: "/rooms/triple-bed-premium.jpg",
  },
  {
    key: "mixed-ac-bunk",
    name: "Mixed AC Bunk Bed",
    detail: "Shared AC dorm",
    bed: "single",
    priceInr: 599,
    priceUnit: "per bed",
    photo: "/rooms/mixed-ac-bunk.jpg",
  },
];

/**
 * Room-rate cards for the homepage hero. Each "Book" opens the same enquiry
 * dialog as every other listing; the room travels as the enquiry's subject, so
 * it lands in the admin inbox named and priced.
 */
export function HeroRooms({
  whatsappNumber,
  open,
}: {
  whatsappNumber: string;
  /** False while the owner's hotel closure is on; the general enquiry path does not check it. */
  open: boolean;
}) {
  const [selected, setSelected] = React.useState<EnquiryProduct | null>(null);

  return (
    <>
      <ul className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4" aria-label="Rooms and rates">
        {HERO_ROOMS.map((room, i) => {
          const BedIcon = room.bed === "single" ? BedSingle : BedDouble;
          return (
            <li key={room.key} className="min-w-0">
              <Card elevation="raised" className="flex h-full flex-col">
                <div className="relative aspect-[4/3] bg-jade-900">
                  <Image
                    src={room.photo}
                    alt={`${room.name} at Ganga Veda`}
                    fill
                    sizes="(min-width: 1024px) 18rem, 50vw"
                    priority={i < 2}
                    className="object-cover"
                  />
                </div>
                <div className="flex flex-1 flex-col p-3 sm:p-4">
                  <h3 className="text-small font-semibold text-ink sm:text-subtitle">{room.name}</h3>
                  <p className="mt-1 flex items-start gap-1.5 text-caption text-ink-faint">
                    <BedIcon className="mt-px size-3.5 shrink-0" aria-hidden />
                    {room.detail}
                  </p>
                  <p className="mt-auto pt-3">
                    <span className="tabular text-title text-ink">{formatINR(room.priceInr)}</span>{" "}
                    <span className="text-caption text-ink-faint">{room.priceUnit}</span>
                  </p>
                  <Button
                    type="button"
                    block
                    className="mt-3"
                    disabled={!open}
                    onClick={() =>
                      setSelected({
                        kind: "general",
                        slug: `room:${room.key}`,
                        name: room.name,
                        priceInr: room.priceInr,
                        priceUnit: room.priceUnit,
                      })
                    }
                  >
                    {open ? "Book" : "Closed"}
                  </Button>
                </div>
              </Card>
            </li>
          );
        })}
      </ul>

      {selected && (
        <EnquiryDialog
          product={selected}
          open
          onClose={() => setSelected(null)}
          source="hero"
          whatsappNumber={whatsappNumber}
        />
      )}
    </>
  );
}
