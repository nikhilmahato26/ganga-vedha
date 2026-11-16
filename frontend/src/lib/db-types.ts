/**
 * Database row types, exactly as the admin API returns them as JSON (timestamps are ISO strings).
 * Type-only re-exports of the API's Drizzle schema: no backend code is bundled into the site, but
 * `pnpm typecheck` here needs backend/node_modules installed (ARCHITECTURE.md §11).
 */
export type {
  AdminUser,
  Adventure,
  Closure,
  ContentBlock,
  Destination,
  Enquiry,
  GalleryItem,
  Hotel,
  HotelRoom,
  Media,
  Package,
  Promotion,
  Rental,
  Review,
  ServiceLine,
  SiteSettings,
} from "../../../backend/src/schema";
