/** Admin actions for rentals: typed callers of backend/src/actions/rentals.ts through /api/admin/rpc. */
import { rpc } from "../rpc";
import type { RentalActionState } from "../action-types";

export type { RentalActionState };

export const createRental = (input: unknown) => rpc<RentalActionState>("rentals.createRental", [input]);
export const updateRental = (id: number, input: unknown) => rpc<RentalActionState>("rentals.updateRental", [id, input]);
export const deleteRental = (id: number) => rpc<void>("rentals.deleteRental", [id]);
export const setRentalPublished = (id: number, isPublished: boolean) => rpc<void>("rentals.setRentalPublished", [id, isPublished]);
export const moveRental = (id: number, direction: "up" | "down") => rpc<void>("rentals.moveRental", [id, direction]);
