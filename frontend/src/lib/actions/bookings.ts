/** Admin actions for bookings: typed callers of backend/src/actions/bookings.ts through /api/admin/rpc. */
import { rpc } from "../rpc";
import type { EnquiryStatus } from "../action-types";

export type { EnquiryStatus };

export const setEnquiryStatus = (id: number, status: EnquiryStatus) => rpc<void>("bookings.setEnquiryStatus", [id, status]);
export const setEnquiryNote = (id: number, adminNote: string) => rpc<void>("bookings.setEnquiryNote", [id, adminNote]);
