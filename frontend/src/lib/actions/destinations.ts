/** Admin actions for destinations: typed callers of backend/src/actions/destinations.ts through /api/admin/rpc. */
import { rpc } from "../rpc";
import type { DestinationActionState } from "../action-types";

export type { DestinationActionState };

export const createDestination = (input: unknown) => rpc<DestinationActionState>("destinations.createDestination", [input]);
export const updateDestination = (id: number, input: unknown) => rpc<DestinationActionState>("destinations.updateDestination", [id, input]);
export const deleteDestination = (id: number) => rpc<void>("destinations.deleteDestination", [id]);
export const setDestinationPublished = (id: number, isPublished: boolean) => rpc<void>("destinations.setDestinationPublished", [id, isPublished]);
export const moveDestination = (id: number, direction: "up" | "down") => rpc<void>("destinations.moveDestination", [id, direction]);
