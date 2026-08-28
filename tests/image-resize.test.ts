import assert from "node:assert/strict";
import { test } from "node:test";
import { computeResizeDimensions } from "../src/lib/image-resize.ts";

test("passes through an image already within bounds", () => {
  const r = computeResizeDimensions(1200, 800, 2000);
  assert.deepEqual(r, { width: 1200, height: 800, scaled: false });
});

test("scales down a landscape photo by its long edge", () => {
  const r = computeResizeDimensions(4032, 3024, 2000);
  assert.equal(r.scaled, true);
  assert.equal(r.width, 2000);
  assert.equal(r.height, 1500);
});

test("scales down a portrait photo by its long edge", () => {
  const r = computeResizeDimensions(3024, 4032, 2000);
  assert.equal(r.scaled, true);
  assert.equal(r.height, 2000);
  assert.equal(r.width, 1500);
});

test("a square image right at the boundary is not scaled", () => {
  const r = computeResizeDimensions(2000, 2000, 2000);
  assert.equal(r.scaled, false);
});

test("one pixel over the boundary is scaled", () => {
  const r = computeResizeDimensions(2001, 2001, 2000);
  assert.equal(r.scaled, true);
  assert.equal(r.width, 2000);
  assert.equal(r.height, 2000);
});

test("rejects invalid source dimensions", () => {
  assert.throws(() => computeResizeDimensions(0, 100, 2000));
  assert.throws(() => computeResizeDimensions(100, -1, 2000));
});
