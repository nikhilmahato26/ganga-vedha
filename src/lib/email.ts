import "server-only";
import nodemailer from "nodemailer";
import { emailConfig, hasEmail, publicEnv } from "@/lib/env";
import { formatDateIST, formatINR, formatPhoneIN, whatsappHref } from "@/lib/format";

export type EnquiryEmail = {
  refCode: string;
  productKind: string;
  productName: string;
  priceInr: number | null;
  name: string;
  phone: string;
  email: string | null;
  travelDate: string | null;
  groupSize: number | null;
  message: string | null;
  source: string;
  subject: string | null;
};

/** One transporter per module instance, created lazily on first send. */
let transporter: nodemailer.Transporter | null = null;

function getTransporter() {
  if (transporter) return transporter;
  const c = emailConfig();
  transporter = nodemailer.createTransport({
    host: c.host,
    port: c.port,
    secure: c.secure,
    auth: { user: c.user, pass: c.pass },
  });
  return transporter;
}

const KIND_LABEL: Record<string, string> = {
  rafting: "Rafting",
  bungee: "Bungee",
  activity: "Activity",
  hotel: "Hotel",
  package: "Package",
  rental: "Rental",
  general: "General enquiry",
};

/**
 * Emails the owner the moment an enquiry lands. Best-effort: a mail failure is
 * logged and swallowed so it can never roll back or block the enquiry itself —
 * the row is already saved and the ref code already shown to the visitor.
 */
export async function sendEnquiryNotification(e: EnquiryEmail): Promise<void> {
  if (!hasEmail()) return;

  try {
    const c = emailConfig();
    const kind = KIND_LABEL[e.productKind] ?? e.productKind;
    const wa = whatsappHref(
      e.phone,
      `Hi ${e.name}, this is Ganga Vedha about your enquiry (${e.refCode}) for ${e.productName}.`,
    );
    const rows: [string, string][] = [
      ["Reference", e.refCode],
      ["Type", kind],
      ["About", e.productName],
      e.priceInr !== null ? ["Listed price", `${formatINR(e.priceInr)}`] : ["Listed price", "—"],
      ["Name", e.name],
      ["Phone", formatPhoneIN(e.phone)],
      ["Email", e.email || "—"],
      ["Travel date", e.travelDate ? formatDateIST(e.travelDate) : "flexible / not given"],
      ["Group size", e.groupSize ? String(e.groupSize) : "—"],
      ["Came from", e.source],
    ];
    if (e.subject) rows.splice(3, 0, ["Subject", e.subject]);

    const text =
      `New enquiry — ${e.refCode}\n\n` +
      rows.map(([k, v]) => `${k}: ${v}`).join("\n") +
      (e.message ? `\n\nMessage:\n${e.message}` : "") +
      (wa ? `\n\nWhatsApp: ${wa}` : "") +
      `\nCall: tel:+91${e.phone.replace(/\D/g, "").slice(-10)}` +
      `\n\nManage: ${publicEnv.NEXT_PUBLIC_SITE_URL}/admin/bookings`;

    const html = `
      <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;color:#1b2220;max-width:560px">
        <h2 style="margin:0 0 4px;font-size:18px">New enquiry — ${escapeHtml(e.refCode)}</h2>
        <p style="margin:0 0 16px;color:#55625d;font-size:13px">via ${escapeHtml(e.source)}</p>
        <table style="border-collapse:collapse;width:100%;font-size:14px">
          ${rows
            .map(
              ([k, v]) =>
                `<tr><td style="padding:6px 12px 6px 0;color:#687570;white-space:nowrap;vertical-align:top">${escapeHtml(
                  k,
                )}</td><td style="padding:6px 0;font-weight:600">${escapeHtml(v)}</td></tr>`,
            )
            .join("")}
        </table>
        ${
          e.message
            ? `<p style="margin:16px 0 4px;color:#687570;font-size:13px">Message</p><p style="margin:0;white-space:pre-wrap">${escapeHtml(
                e.message,
              )}</p>`
            : ""
        }
        <p style="margin:20px 0 0">
          ${
            wa
              ? `<a href="${wa}" style="display:inline-block;background:#25D366;color:#fff;text-decoration:none;padding:9px 16px;border-radius:8px;font-weight:600;font-size:14px;margin-right:8px">WhatsApp ${escapeHtml(
                  e.name,
                )}</a>`
              : ""
          }
          <a href="tel:+91${e.phone.replace(/\D/g, "").slice(-10)}" style="display:inline-block;background:#d93b0c;color:#fff;text-decoration:none;padding:9px 16px;border-radius:8px;font-weight:600;font-size:14px">Call</a>
        </p>
        <p style="margin:16px 0 0;font-size:13px">
          <a href="${publicEnv.NEXT_PUBLIC_SITE_URL}/admin/bookings" style="color:#12655b">Open the bookings inbox →</a>
        </p>
      </div>`;

    await getTransporter().sendMail({
      from: `"Ganga Vedha site" <${c.user}>`,
      to: c.to,
      replyTo: e.email || undefined,
      subject: `New enquiry: ${e.productName} — ${e.name} (${e.refCode})`,
      text,
      html,
    });
  } catch (err) {
    console.error("[email] failed to send enquiry notification", err);
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
