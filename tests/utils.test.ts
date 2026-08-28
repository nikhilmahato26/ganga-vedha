import assert from "node:assert/strict";
import { test } from "node:test";
import { cn } from "../src/lib/utils.ts";

/**
 * Regression test for a real defect: tailwind-merge classified our custom
 * font-size tokens (`text-small`, `text-subtitle`, `text-display-md`) as text
 * COLOUR utilities and silently stripped the `text-white` declared before them,
 * which made every filled button render dark text on an orange fill.
 */
test("custom font-size tokens do not collide with text colour", () => {
  assert.equal(cn("text-white text-small"), "text-white text-small");
  assert.equal(cn("text-white text-subtitle"), "text-white text-subtitle");
  assert.equal(cn("text-white text-display-md"), "text-white text-display-md");
  assert.equal(cn("text-white text-label"), "text-white text-label");
});

test("genuine conflicts still collapse to the last value", () => {
  assert.equal(cn("text-ink text-white"), "text-white");
  assert.equal(cn("text-small text-title"), "text-title");
  assert.equal(cn("bg-cta bg-jade-700"), "bg-jade-700");
});

test("the button recipe keeps both its colour and its size", () => {
  const out = cn("bg-cta text-white shadow-sm", "h-9 rounded-sm px-3.5 text-small");
  assert.ok(out.includes("text-white"), `text-white was stripped from: ${out}`);
  assert.ok(out.includes("text-small"), `text-small was stripped from: ${out}`);
});
