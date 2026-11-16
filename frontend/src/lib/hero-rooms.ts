/**
 * The room-rate cards in the homepage hero, stored as the items of the
 * `hero-rooms` content block and edited from the admin Hotels page. They are
 * deliberately not hotel rows: they are the owner's own rate card, booked on the
 * Roomnexa engine, and a "per bed" dorm rate has no place in `hotel_rooms`.
 */
export const HERO_ROOMS_KEY = "hero-rooms";

export const HERO_ROOMS_MAX = 8;

export type HeroRoomItem = {
  name: string;
  /** One short line under the name: "Double bed, balcony". */
  detail: string;
  /** Picks the card's icon. Bunk beds are sold per bed, so they get the single. */
  bed: "double" | "single";
  priceInr: number;
  priceUnit: string;
  /** An uploaded photo. Wins over `photo` whenever it still exists. */
  mediaId: number | null;
  /** A photo shipped under /public/rooms, cropped from the owner's poster. */
  photo: string | null;
};

/** Only these shipped files may be named by `photo`; anything else is uploaded media. */
export const HERO_ROOM_PHOTO_PATTERN = /^\/rooms\/[a-z0-9-]+\.jpg$/;

/**
 * The four room types and rates from the owner's poster (October 2026). Shown
 * until an admin first saves the section, and used as the editor's starting rows.
 */
export const HERO_ROOMS_DEFAULT: HeroRoomItem[] = [
  {
    name: "Super Deluxe Room",
    detail: "Double bed",
    bed: "double",
    priceInr: 1499,
    priceUnit: "per night",
    mediaId: null,
    photo: "/rooms/deluxe-double.jpg",
  },
  {
    name: "Premium Room with Balcony",
    detail: "Double bed, balcony",
    bed: "double",
    priceInr: 1999,
    priceUnit: "per night",
    mediaId: null,
    photo: "/rooms/double-bed-balcony.jpg",
  },
  {
    name: "Triple Bed Luxury Room",
    detail: "Three beds, for families",
    bed: "double",
    priceInr: 2499,
    priceUnit: "per night",
    mediaId: null,
    photo: "/rooms/triple-bed-premium.jpg",
  },
  {
    name: "Mixed AC Bunk Bed",
    detail: "Shared AC dorm",
    bed: "single",
    priceInr: 599,
    priceUnit: "per bed",
    mediaId: null,
    photo: "/rooms/mixed-ac-bunk.jpg",
  },
];
