/** Admin actions for hotels: typed callers of backend/src/actions/hotels.ts through /api/admin/rpc. */
import { rpc } from "../rpc";
import type { HotelActionState } from "../action-types";

export type { HotelActionState };

export const createHotel = (input: unknown) => rpc<HotelActionState>("hotels.createHotel", [input]);
export const updateHotel = (id: number, input: unknown) => rpc<HotelActionState>("hotels.updateHotel", [id, input]);
export const deleteHotel = (id: number) => rpc<void>("hotels.deleteHotel", [id]);
export const setHotelPublished = (id: number, isPublished: boolean) => rpc<void>("hotels.setHotelPublished", [id, isPublished]);
export const moveHotel = (id: number, direction: "up" | "down") => rpc<void>("hotels.moveHotel", [id, direction]);
