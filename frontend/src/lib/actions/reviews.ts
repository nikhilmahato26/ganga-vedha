/** Admin actions for reviews: typed callers of backend/src/actions/reviews.ts through /api/admin/rpc. */
import { rpc } from "../rpc";
import type { ReviewActionState } from "../action-types";

export type { ReviewActionState };

export const createReview = (input: unknown) => rpc<ReviewActionState>("reviews.createReview", [input]);
export const updateReview = (id: number, input: unknown) => rpc<ReviewActionState>("reviews.updateReview", [id, input]);
export const deleteReview = (id: number) => rpc<void>("reviews.deleteReview", [id]);
export const setReviewPublished = (id: number, isPublished: boolean) => rpc<void>("reviews.setReviewPublished", [id, isPublished]);
export const moveReview = (id: number, direction: "up" | "down") => rpc<void>("reviews.moveReview", [id, direction]);
