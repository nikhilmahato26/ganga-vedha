/** Admin actions for adventures: typed callers of backend/src/actions/adventures.ts through /api/admin/rpc. */
import { rpc } from "../rpc";
import type { AdventureActionState } from "../action-types";

export type { AdventureActionState };

export const createAdventure = (input: unknown) => rpc<AdventureActionState>("adventures.createAdventure", [input]);
export const updateAdventure = (id: number, input: unknown) => rpc<AdventureActionState>("adventures.updateAdventure", [id, input]);
export const deleteAdventure = (id: number) => rpc<void>("adventures.deleteAdventure", [id]);
export const setAdventurePublished = (id: number, isPublished: boolean) => rpc<void>("adventures.setAdventurePublished", [id, isPublished]);
export const moveAdventure = (id: number, direction: "up" | "down") => rpc<void>("adventures.moveAdventure", [id, direction]);
