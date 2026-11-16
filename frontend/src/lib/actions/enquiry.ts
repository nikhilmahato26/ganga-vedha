import { apiEnabled, ApiError, apiPost } from "../api";
import { generateRefCode } from "../format";
import type { EnquiryInput, EnquiryResult } from "../enquiry-schema";

/**
 * Saves an enquiry (POST /api/enquiries, validated again by the API with the same schema). A failed
 * save never blocks WhatsApp: the form opens the chat either way. With no API configured the site
 * still works, it just doesn't keep a copy.
 */
export async function submitEnquiry(input: EnquiryInput): Promise<EnquiryResult> {
  if (!apiEnabled) return { ok: true, refCode: generateRefCode(), productName: "", persisted: false };
  try {
    return await apiPost<EnquiryResult>("/api/enquiries", input);
  } catch (err) {
    if (err instanceof ApiError && err.status === 400 && err.fields) {
      return { ok: false, fieldErrors: err.fields };
    }
    return {
      ok: false,
      fieldErrors: {},
      formError: err instanceof Error ? err.message : "Something went wrong. Please try again.",
    };
  }
}
