import Image from "next/image";
import { BedDouble, BedSingle } from "lucide-react";
import { Button, Card, LinkButton } from "@/components/ui";
import { formatINR } from "@/lib/format";
import { ROOM_BOOKING_URL } from "@/lib/room-booking";
import type { HeroRoom } from "@/lib/content";

/**
 * Room-rate cards for the homepage hero. Each "Book" opens the Roomnexa booking
 * engine in a new tab, where the guest picks dates against live availability.
 * The rooms themselves are edited on the admin Hotels page.
 */
export function HeroRooms({
  rooms,
  open,
}: {
  rooms: HeroRoom[];
  /** False while the owner's hotel closure is on; the general enquiry path does not check it. */
  open: boolean;
}) {
  return (
    <ul className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4" aria-label="Rooms and rates">
      {rooms.map((room, i) => {
        const BedIcon = room.bed === "single" ? BedSingle : BedDouble;
        return (
          // Index keys: the list is only ever replaced whole, by an admin save.
          <li key={i} className="min-w-0">
            <Card elevation="raised" className="flex h-full flex-col">
              <div className="relative grid aspect-[4/3] place-items-center bg-jade-900">
                {room.photo ? (
                  <Image
                    src={room.photo.src}
                    alt={room.photo.alt || `${room.name} at Ganga Veda`}
                    fill
                    sizes="(min-width: 1024px) 18rem, 50vw"
                    priority={i < 2}
                    placeholder={room.photo.placeholder ? "blur" : "empty"}
                    blurDataURL={room.photo.placeholder ?? undefined}
                    className="object-cover"
                  />
                ) : (
                  <BedIcon className="size-10 text-jade-300/60" aria-hidden />
                )}
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
                {open ? (
                  <LinkButton
                    href={ROOM_BOOKING_URL}
                    target="_blank"
                    rel="noopener"
                    block
                    className="mt-3"
                    aria-label={`Book ${room.name}`}
                  >
                    Book
                  </LinkButton>
                ) : (
                  <Button type="button" block className="mt-3" disabled>
                    Closed
                  </Button>
                )}
              </div>
            </Card>
          </li>
        );
      })}
    </ul>
  );
}
