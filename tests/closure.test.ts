import assert from "node:assert/strict";
import { test } from "node:test";
import { resolveClosure, isBookable, closureDismissKey } from "../src/lib/closure.ts";
import type { Closure } from "../src/lib/content.ts";

const base = {
  icon: "rain" as const,
  title: "t",
  body: "b",
  footnote: null,
  ctaLabel: "Got it",
  version: 1,
};

const raftingClosed: Closure = {
  id: 1, scope: "service", serviceKey: "rafting", entityType: null, entityId: null,
  isActive: true, ...base,
};
const globalClosed: Closure = {
  id: 2, scope: "global", serviceKey: null, entityType: null, entityId: null,
  isActive: true, ...base, title: "global",
};
const oneStretchClosed: Closure = {
  id: 3, scope: "entity", serviceKey: null, entityType: "adventure", entityId: 3,
  isActive: true, ...base, title: "entity",
};

test("closing rafting must not close hotels", () => {
  assert.equal(isBookable([raftingClosed], { service: "rafting" }), false);
  assert.equal(isBookable([raftingClosed], { service: "hotel" }), true);
  assert.equal(isBookable([raftingClosed], { service: "bungee" }), true);
});

test("a global closure closes everything", () => {
  for (const s of ["rafting", "hotel", "bungee"] as const) {
    assert.equal(isBookable([globalClosed], { service: s }), false);
  }
});

test("the most specific active scope wins", () => {
  const hit = resolveClosure([globalClosed, raftingClosed, oneStretchClosed], {
    service: "rafting", entityType: "adventure", entityId: 3,
  });
  assert.equal(hit?.title, "entity");

  const svc = resolveClosure([globalClosed, raftingClosed], {
    service: "rafting", entityType: "adventure", entityId: 3,
  });
  assert.equal(svc?.scope, "service");

  const glob = resolveClosure([globalClosed], { service: "hotel" });
  assert.equal(glob?.scope, "global");
});

test("an entity closure does not leak to its siblings", () => {
  assert.equal(
    isBookable([oneStretchClosed], { service: "rafting", entityType: "adventure", entityId: 2 }),
    true,
  );
  assert.equal(
    isBookable([oneStretchClosed], { service: "rafting", entityType: "adventure", entityId: 3 }),
    false,
  );
});

test("inactive closures are ignored", () => {
  assert.equal(isBookable([{ ...raftingClosed, isActive: false }], { service: "rafting" }), true);
  assert.equal(resolveClosure([], { service: "rafting" }), null);
});

test("editing the message brings a dismissed notice back", () => {
  const v1 = closureDismissKey(raftingClosed);
  const v2 = closureDismissKey({ ...raftingClosed, version: 2 });
  assert.notEqual(v1, v2);
});
