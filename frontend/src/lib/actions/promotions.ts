/** Admin actions for promotions: typed callers of backend/src/actions/promotions.ts through /api/admin/rpc. */
import { rpc } from "../rpc";
import type { PromotionActionState } from "../action-types";

export type { PromotionActionState };

export const createPromotion = (input: unknown) => rpc<PromotionActionState>("promotions.createPromotion", [input]);
export const updatePromotion = (id: number, input: unknown) => rpc<PromotionActionState>("promotions.updatePromotion", [id, input]);
export const deletePromotion = (id: number) => rpc<void>("promotions.deletePromotion", [id]);
export const setPromotionActive = (id: number, isActive: boolean) => rpc<void>("promotions.setPromotionActive", [id, isActive]);
export const movePromotion = (id: number, direction: "up" | "down") => rpc<void>("promotions.movePromotion", [id, direction]);
