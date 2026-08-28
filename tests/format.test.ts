import assert from "node:assert/strict";
import { test } from "node:test";
import {
  formatDateIST,
  formatDateTimeIST,
  formatDuration,
  formatINR,
  formatKm,
  formatPhoneIN,
  generateRefCode,
  normalizePhoneIN,
  slugify,
  todayIST,
  whatsappHref,
} from "../src/lib/format.ts";

test("formatINR uses Indian digit grouping", () => {
  assert.equal(formatINR(2490), "₹2,490");
  assert.equal(formatINR(159000), "₹1,59,000");
  assert.equal(formatINR(null), "—");
});

test("formatKm drops a trailing .0", () => {
  assert.equal(formatKm(16), "16 km");
  assert.equal(formatKm(16.5), "16.5 km");
  assert.equal(formatKm("24.0"), "24 km");
  assert.equal(formatKm(null), "—");
});

test("formatDuration reads as hours and minutes", () => {
  assert.equal(formatDuration(150), "2 hr 30 min");
  assert.equal(formatDuration(120), "2 hr");
  assert.equal(formatDuration(45), "45 min");
  assert.equal(formatDuration(0), "—");
});

test("normalizePhoneIN reduces every written form to ten digits", () => {
  for (const input of [
    "+91 98765 43210",
    "098765-43210",
    "919876543210",
    "00919876543210",
    "9876543210",
    " 98765 43210 ",
  ]) {
    assert.equal(normalizePhoneIN(input), "9876543210", `failed on ${input}`);
  }
});

test("normalizePhoneIN rejects what WhatsApp cannot dial", () => {
  for (const bad of ["1234567890", "5876543210", "98765", "", null, "abcdefghij"]) {
    assert.equal(normalizePhoneIN(bad), null, `should reject ${bad}`);
  }
});

test("whatsappHref is either valid or absent, never half-built", () => {
  assert.equal(
    whatsappHref("9876543210", "hi there"),
    "https://wa.me/919876543210?text=hi%20there",
  );
  assert.equal(whatsappHref("9876543210"), "https://wa.me/919876543210");
  assert.equal(whatsappHref("nonsense"), null);
});

test("formatPhoneIN renders a readable number", () => {
  assert.equal(formatPhoneIN("919876543210"), "+91 98765 43210");
});

test("dates are pinned to IST with a stable three-letter month", () => {
  assert.match(todayIST(), /^\d{4}-\d{2}-\d{2}$/);
  assert.equal(formatDateIST("2026-09-14"), "14 Sep 2026");
  // A date must not shift backwards for a server running west of IST.
  assert.equal(formatDateIST("2026-01-01"), "1 Jan 2026");
});

test("slugify produces url-safe shapes", () => {
  assert.equal(slugify("16 KM Rafting from Shivpuri!"), "16-km-rafting-from-shivpuri");
  assert.equal(slugify("Ganga Vedha — Café  Deluxe"), "ganga-vedha-cafe-deluxe");
  assert.equal(slugify("  --Hello--  "), "hello");
});

test("ref codes exclude ambiguous glyphs", () => {
  for (let i = 0; i < 200; i++) {
    assert.match(generateRefCode(), /^GV-[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{6}$/);
  }
});

test("formatDateTimeIST never contains ICU's narrow no-break space", () => {
  // Node's bundled ICU and a browser's do not always agree on the space
  // character before AM/PM, which is invisible in a diff but caused a real
  // Next.js hydration mismatch on the bookings inbox — this pins the output
  // to plain ASCII spaces so server and client can never disagree again.
  const out = formatDateTimeIST(new Date("2026-08-28T18:25:00+05:30"));
  assert.equal(out, "28 Aug, 6:25 pm");
  assert.equal(/[  ]/.test(out), false, `contains non-ASCII space: ${JSON.stringify(out)}`);
});
