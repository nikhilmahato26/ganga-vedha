/**
 * Room bookings go to the owner's Roomnexa booking engine (NexaStay, hotel 184),
 * which holds the live availability, rates and payment options. Every other
 * product (rafting, bungee, packages, rentals) stays on the enquiry flow.
 *
 * The engine also reads `check_in` / `check_out` (YYYY-MM-DD) from the query
 * string, should a page ever collect dates before sending the guest across.
 */
export const ROOM_BOOKING_URL = "https://ganga-veda.roomnexa.com/";
