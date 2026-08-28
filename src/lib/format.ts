/**
 * Formatting and normalisation used on both the public site and the admin panel.
 * Everything date-shaped is pinned to Asia/Kolkata: the audience, the operator
 * and the river are all in one timezone, and "today" must mean the same thing
 * on a Mumbai phone and on a Vercel box in Washington.
 */

export const IST = "Asia/Kolkata";

const inr = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

/** 2490 -> "₹2,490". Prices are stored as whole rupees, never paise. */
export function formatINR(amount: number | null | undefined): string {
  if (amount === null || amount === undefined || Number.isNaN(amount)) return "—";
  return inr.format(Math.round(amount));
}

/** 16 -> "16 km"; 16.5 -> "16.5 km". Trailing ".0" is never shown. */
export function formatKm(km: number | string | null | undefined): string {
  if (km === null || km === undefined || km === "") return "—";
  const n = typeof km === "string" ? Number(km) : km;
  if (Number.isNaN(n)) return "—";
  const s = Number.isInteger(n) ? String(n) : String(Number(n.toFixed(1)));
  return `${s} km`;
}

/** 150 -> "2 hr 30 min"; 120 -> "2 hr"; 45 -> "45 min". */
export function formatDuration(minutes: number | null | undefined): string {
  if (!minutes || minutes <= 0) return "—";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m} min`;
  if (m === 0) return `${h} hr`;
  return `${h} hr ${m} min`;
}

/** Compact form for a stat cell where the label already says "Duration". */
export function formatDurationShort(minutes: number | null | undefined): string {
  if (!minutes || minutes <= 0) return "—";
  const h = minutes / 60;
  if (minutes % 60 === 0) return `${h} hr`;
  return `${(Math.round(h * 10) / 10).toString()} hr`;
}

/**
 * Reduce anything a person might type into the ten digits WhatsApp needs.
 * Accepts "+91 98765 43210", "098765-43210", "918765432109", "9876543210".
 * Returns null when the result is not a valid Indian mobile number, so a
 * broken deep-link can never be rendered.
 */
export function normalizePhoneIN(raw: string | null | undefined): string | null {
  if (!raw) return null;
  let d = raw.replace(/\D+/g, "");
  if (d.length > 10 && d.startsWith("00")) d = d.slice(2);
  if (d.length === 12 && d.startsWith("91")) d = d.slice(2);
  if (d.length === 11 && d.startsWith("0")) d = d.slice(1);
  if (!/^[6-9]\d{9}$/.test(d)) return null;
  return d;
}

/** "9876543210" -> "+91 98765 43210" for display. */
export function formatPhoneIN(raw: string | null | undefined): string {
  const d = normalizePhoneIN(raw);
  if (!d) return raw?.trim() ?? "—";
  return `+91 ${d.slice(0, 5)} ${d.slice(5)}`;
}

/** A wa.me link that is either valid or absent. Never a half-built href. */
export function whatsappHref(
  phone: string | null | undefined,
  message?: string,
): string | null {
  const d = normalizePhoneIN(phone);
  if (!d) return null;
  const base = `https://wa.me/91${d}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}

/** Today in IST as "YYYY-MM-DD" — the value a <input type="date"> min wants. */
export function todayIST(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: IST,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

/** "2026-09-14" -> "14 Sep 2026". Parsed as a plain date, never shifted. */
export function formatDateIST(value: string | Date | null | undefined): string {
  if (!value) return "—";
  const date =
    typeof value === "string"
      ? new Date(`${value.slice(0, 10)}T12:00:00+05:30`)
      : value;
  if (Number.isNaN(date.getTime())) return "—";
  return formatParts(date, {
    timeZone: IST,
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/**
 * ICU has shipped both "Sep" and "Sept" for en-IN across Node versions, which
 * makes month width drift between the developer's machine and the server.
 * Assemble from parts and clamp the month to three letters so a stat cell is
 * the same width everywhere.
 */
function formatParts(date: Date, opts: Intl.DateTimeFormatOptions): string {
  return new Intl.DateTimeFormat("en-GB", opts)
    .formatToParts(date)
    .map((p) => {
      if (p.type === "month") return p.value.slice(0, 3);
      // ICU inserts a narrow no-break space (U+202F) before AM/PM on some
      // builds and a plain space on others — Node's bundled ICU and a
      // browser's do not always agree, which is invisible in a diff but a
      // real byte mismatch, and a real Next.js hydration failure on any page
      // that renders a 12-hour time server-side. Every "literal" part is
      // pinned to a plain space so server and client always produce the
      // identical string.
      // Normalize only the whitespace WITHIN a literal (e.g. the ", " between
      // day and hour bundles as one token) rather than replacing the whole
      // literal, which would silently drop the comma along with the space.
      if (p.type === "literal") return p.value.replace(/\s/g, " ");
      return p.value;
    })
    .join("");
}

/** Timestamps in the admin inbox: "14 Sep, 4:20 pm". */
export function formatDateTimeIST(value: Date | string | null | undefined): string {
  if (!value) return "—";
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "—";
  return formatParts(date, {
    timeZone: IST,
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

/**
 * URL-safe slug. Collisions are resolved by the caller against the database —
 * this function only guarantees shape, never uniqueness.
 */
export function slugify(input: string): string {
  return input
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

/** Human-readable enquiry reference: "GV-7Q4KD2". Ambiguous glyphs excluded. */
const REF_ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
export function generateRefCode(): string {
  let out = "";
  const bytes =
    typeof crypto !== "undefined" && crypto.getRandomValues
      ? crypto.getRandomValues(new Uint8Array(6))
      : Uint8Array.from({ length: 6 }, () => Math.floor(Math.random() * 256));
  for (const b of bytes) out += REF_ALPHABET[b % REF_ALPHABET.length];
  return `GV-${out}`;
}

export function pluralize(n: number, one: string, many = `${one}s`): string {
  return n === 1 ? one : many;
}
