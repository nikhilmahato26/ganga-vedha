/** Admin actions for gallery: typed callers of backend/src/actions/gallery.ts through /api/admin/rpc. */
import { rpc } from "../rpc";
import type { GalleryActionState } from "../action-types";

export type { GalleryActionState };

export const createGalleryItem = (input: unknown) => rpc<GalleryActionState>("gallery.createGalleryItem", [input]);
export const updateGalleryItem = (id: number, input: unknown) => rpc<GalleryActionState>("gallery.updateGalleryItem", [id, input]);
export const deleteGalleryItem = (id: number) => rpc<void>("gallery.deleteGalleryItem", [id]);
export const moveGalleryItem = (id: number, direction: "up" | "down") => rpc<void>("gallery.moveGalleryItem", [id, direction]);
