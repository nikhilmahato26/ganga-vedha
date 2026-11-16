/**
 * Result shapes of the admin actions (backend/src/actions/*), shared by the API and the admin UI.
 * Pure types with no imports beyond ./content-types, so both runtimes can use them.
 */
import type { ServiceKey } from "./content-types";

export type AdventureActionState =
  | { ok: true; id: number }
  | { ok: false; error: string; fieldErrors?: Record<string, string> }
  | undefined;

export type ServiceClosure = {
  id: number | null;
  serviceKey: ServiceKey;
  isActive: boolean;
  icon: "rain" | "wrench" | "calendar" | "alert";
  title: string;
  body: string;
  footnote: string | null;
  ctaLabel: string;
  version: number;
};

export type ClosureActionState =
  | { ok: true }
  | { ok: false; error: string; fieldErrors?: Record<string, string> }
  | undefined;

export type CustomClosureActionState =
  | { ok: true }
  | { ok: false; error: string; fieldErrors?: Record<string, string> }
  | undefined;

export type ContentBlockActionState =
  | { ok: true }
  | { ok: false; error: string; fieldErrors?: Record<string, string> }
  | undefined;

export type DestinationActionState =
  | { ok: true; id: number }
  | { ok: false; error: string; fieldErrors?: Record<string, string> }
  | undefined;

export type GalleryActionState =
  | { ok: true; id: number }
  | { ok: false; error: string; fieldErrors?: Record<string, string> }
  | undefined;

export type HotelActionState =
  | { ok: true; id: number }
  | { ok: false; error: string; fieldErrors?: Record<string, string> }
  | undefined;

export type PackageActionState =
  | { ok: true; id: number }
  | { ok: false; error: string; fieldErrors?: Record<string, string> }
  | undefined;

export type PromotionActionState =
  | { ok: true; id: number }
  | { ok: false; error: string; fieldErrors?: Record<string, string> }
  | undefined;

export type RentalActionState =
  | { ok: true; id: number }
  | { ok: false; error: string; fieldErrors?: Record<string, string> }
  | undefined;

export type ReviewActionState =
  | { ok: true; id: number }
  | { ok: false; error: string; fieldErrors?: Record<string, string> }
  | undefined;

export type SettingsActionState =
  | { ok: true }
  | { ok: false; error: string; fieldErrors?: Record<string, string> }
  | undefined;

export type EnquiryStatus = "new" | "contacted" | "confirmed" | "completed" | "lost";
