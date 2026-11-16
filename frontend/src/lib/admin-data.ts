import type * as Backend from "../../../backend/src/services/admin-data";
import { rpc } from "./rpc";

/**
 * Admin reads: typed callers of backend/src/services/admin-data.ts through /api/admin/rpc
 * (`data.<name>`). Never cached and never filtered to published rows: the owner always sees the
 * current draft-or-live row. Types are the backend's own (type-only import, nothing bundled).
 */

type Reads = typeof Backend;
type Name = { [K in keyof Reads]: Reads[K] extends (...args: never[]) => Promise<unknown> ? K : never }[keyof Reads];

function call<K extends Name>(name: K) {
  type F = Reads[K] extends (...args: infer A) => Promise<infer R> ? { args: A; result: R } : never;
  return (...args: F["args"]) => rpc<F["result"]>(`data.${name}`, args);
}

export type { EnquiryStatus } from "./action-types";

export const listAdventuresAdmin = call("listAdventuresAdmin");
export const listBungeeBrands = call("listBungeeBrands");
export const listActivitiesAdmin = call("listActivitiesAdmin");
export const getAdventureAdmin = call("getAdventureAdmin");
export const listHotelsAdmin = call("listHotelsAdmin");
export const getHotelAdmin = call("getHotelAdmin");
export const listPackagesAdmin = call("listPackagesAdmin");
export const getPackageAdmin = call("getPackageAdmin");
export const listRentalsAdmin = call("listRentalsAdmin");
export const getRentalAdmin = call("getRentalAdmin");
export const listDestinationsAdmin = call("listDestinationsAdmin");
export const getDestinationAdmin = call("getDestinationAdmin");
export const listDestinationOptions = call("listDestinationOptions");
export const listReviewsAdmin = call("listReviewsAdmin");
export const listPromotionsAdmin = call("listPromotionsAdmin");
export const getPromotionAdmin = call("getPromotionAdmin");
export const listGalleryItemsAdmin = call("listGalleryItemsAdmin");
export const getReviewAdmin = call("getReviewAdmin");
export const listCustomClosuresAdmin = call("listCustomClosuresAdmin");
export const listClosureTargets = call("listClosureTargets");
export const getMediaById = call("getMediaById");
export const getHeroRoomsAdmin = call("getHeroRoomsAdmin");
export const getEntityGallery = call("getEntityGallery");
export const listEnquiriesAdmin = call("listEnquiriesAdmin");
export const getEnquiryAdmin = call("getEnquiryAdmin");
export const getEnquiryStats = call("getEnquiryStats");
export const listUnusedMedia = call("listUnusedMedia");
export const listAuditLog = call("listAuditLog");
export const getSettingsAdmin = call("getSettingsAdmin");
