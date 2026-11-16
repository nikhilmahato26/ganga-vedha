/** Admin actions for media: typed callers of backend/src/actions/media.ts through /api/admin/rpc. */
import { rpc } from "../rpc";
import type { Media } from "../db-types";
import type { MediaRecordInput, UploadFolder } from "../schemas/media";

export type { MediaRecordInput, UploadFolder };

/** A one-shot signed upload ticket; the browser posts the file straight to Cloudinary with it. */
export type UploadTicket = {
  cloudName: string;
  apiKey: string;
  timestamp: number;
  signature: string;
  folder: string;
  publicId?: string;
};

export type MediaRecord = Media;

export const getUploadTicket = (input: { folder: UploadFolder }) => rpc<UploadTicket>("media.getUploadTicket", [input]);
export const createMediaRecord = (input: MediaRecordInput) => rpc<MediaRecord>("media.createMediaRecord", [input]);
export const setEntityGallery = (entityType: "hotel" | "adventure" | "gallery" | "service_line" | "review", entityId: number, mediaIds: number[]) => rpc<void>("media.setEntityGallery", [entityType, entityId, mediaIds]);
export const deleteMedia = (mediaId: number) => rpc<void>("media.deleteMedia", [mediaId]);
