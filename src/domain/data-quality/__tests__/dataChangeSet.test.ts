import { afterEach, expect, it } from "vitest";
import { z } from "zod";
import { approvedReview, reviewRecords } from "@/__tests__/fixtures/dataChangeSet";
import { canonicalJson, contentHash, dataChangeSetSchema, prepareDataChangeSet, reviewSnapshot } from "../dataChangeSet";
import { registerPlugin, resetRegistry } from "@/domain/combat-lab/plugins/registry";

afterEach(resetRegistry);

it("hashes object keys canonically, retaining array order and explicit null", () =>
{
  expect(contentHash({ b: 1, a: { y: 2, x: null } })).toBe(contentHash({ a: { x: null, y: 2 }, b: 1 }));
  expect(contentHash([1, 2])).not.toBe(contentHash([2, 1]));
  expect(contentHash({ x: null })).not.toBe(contentHash({}));
  expect(() => canonicalJson({ value: Infinity })).toThrow();
  expect(() => canonicalJson({ value: undefined })).toThrow();
});

it("retains all JSON object keys and rejects non-JSON objects/cycles", () =>
{
  const special = JSON.parse('{"__proto__":{"value":2}}');
  expect(canonicalJson(special)).toBe('{"__proto__":{"value":2}}');
  expect(contentHash(special)).not.toBe(contentHash({}));
  expect(() => canonicalJson(new Date())).toThrow();
  const cyclic: Record<string, unknown> = {}; cyclic.self = cyclic;
  expect(() => canonicalJson(cyclic)).toThrow();
  expect(() => canonicalJson(new Array(1))).toThrow();
});

it("excludes private relations and guards all reviewed gameplay context", () =>
{
  const record = reviewRecords()[0]!;
  const before = reviewSnapshot(record);
  expect(reviewSnapshot({ ...record, characterIds: ["private"], apiKeys: ["do-not-export"] })).toEqual(before);
  expect(reviewSnapshot({ ...record, tags: ["changed"] }).hash).not.toBe(before.hash);
  expect(reviewSnapshot({ ...record, structuredRequirements: [] }).hash).not.toBe(before.hash);
  expect(reviewSnapshot({ ...record, effects: undefined }).hash).toBe(before.hash);
});

it.each([
  (batch: ReturnType<typeof approvedReview>) => { batch.rows[0]!.reviewState = "needs-decision"; },
  (batch: ReturnType<typeof approvedReview>) => { batch.rows[0]!.review.content.decision = "pending"; },
  (batch: ReturnType<typeof approvedReview>) => { batch.rows[0]!.review.application.evidence = ""; },
  (batch: ReturnType<typeof approvedReview>) => { batch.rows[0]!.review.acceptedRule = ""; },
  (batch: ReturnType<typeof approvedReview>) => { batch.rows[0]!.mechanics.unknowns = ["Duration?"]; },
  (batch: ReturnType<typeof approvedReview>) => { batch.rows[0]!.issues = [{ code: "DQ-SEMANTICS", path: "description", severity: "blocker", evidence: "mismatch", resolution: null }]; },
  (batch: ReturnType<typeof approvedReview>) => { batch.rows[0]!.verification.checks[0]!.result = "NOT_RUN"; },
  (batch: ReturnType<typeof approvedReview>) => { batch.rows[0]!.identityAssertions.grade = 2; },
  (batch: ReturnType<typeof approvedReview>) => { batch.rows[0]!.expectedHash = "0".repeat(64); },
  (batch: ReturnType<typeof approvedReview>) => { batch.rows[0]!.proposed = { effects: [] }; },
  (batch: ReturnType<typeof approvedReview>) => { batch.rows[0]!.proposed.description = batch.rows[0]!.before.description; },
])("blocks unready, stale, incoherent or unverified input before I/O (%#)", change =>
{
  const batch = approvedReview();
  change(batch);
  expect(() => prepareDataChangeSet(batch)).toThrow();
});

it("rejects duplicate targets/review IDs, unknown fields and oversized batches", () =>
{
  const batch = approvedReview();
  expect(dataChangeSetSchema.safeParse({ ...batch, rows: [batch.rows[0], batch.rows[0]] }).success).toBe(false);
  expect(dataChangeSetSchema.safeParse({ ...batch, rows: [batch.rows[0], { ...batch.rows[1], reviewId: batch.rows[0]!.reviewId }] }).success).toBe(false);
  expect(dataChangeSetSchema.safeParse({ ...batch, typo: true }).success).toBe(false);
  expect(dataChangeSetSchema.safeParse({ ...batch, rows: Array.from({ length: 21 }, () => batch.rows[0]) }).success).toBe(false);
});

function mapping()
{
  const batch = approvedReview();
  const row = batch.rows[0]!;
  row.changeKind = "mapping";
  row.proposed = { effects: [{ type: "stat", mode: "self", duration: 1, resistance: 2 }], simulatable: true, unsupportedReason: null };
  row.verification.checks.push({ name: "engine fixture", kind: "engine", result: "PASS", evidence: "synthetic fixture" });
  return batch;
}

it.each([
  (batch: ReturnType<typeof approvedReview>) => { delete batch.rows[0]!.proposed.simulatable; },
  (batch: ReturnType<typeof approvedReview>) => { batch.rows[0]!.proposed.unsupportedReason = "old reason"; },
  (batch: ReturnType<typeof approvedReview>) => { batch.rows[0]!.proposed.effects = []; },
  (batch: ReturnType<typeof approvedReview>) => { batch.rows[0]!.proposed.effects = [{ type: "chance", chance: 50, then: [{ type: "push", distance: 1, typo: 2 }] }]; },
  (batch: ReturnType<typeof approvedReview>) => { batch.rows[0]!.verification.checks.pop(); },
])("blocks incomplete supported mapping (%#)", change =>
{
  const batch = mapping(); change(batch);
  expect(() => prepareDataChangeSet(batch)).toThrow();
});

it("requires an explicit unsupported withdrawal with reason and no active effects", () =>
{
  const batch = mapping();
  const row = batch.rows[0]!;
  row.reviewState = "unsupported";
  row.proposed = { effects: [], simulatable: false, unsupportedReason: "Group targeting is not implemented." };
  expect(prepareDataChangeSet(batch).rows[0]!.after.simulatable).toBe(false);
  row.proposed.effects = [{ type: "push", distance: 1 }];
  expect(() => prepareDataChangeSet(batch)).toThrow();
});

it("binds parsed plugin output to persistence and journal identity", () =>
{
  registerPlugin({ id: "test", name: "Test", version: "1", effects: [{ effectType: "normalized", apply() {}, describe: () => "", schema: z.object({ amount: z.number().default(4) }) }] });
  const batch = mapping();
  batch.rows[0]!.proposed.effects = [{ type: "custom", effectType: "normalized", data: {} }];
  const prepared = prepareDataChangeSet(batch);
  expect(prepared.rows[0]!.patch.effects).toEqual([{ type: "custom", effectType: "normalized", data: { amount: 4 } }]);
  expect(prepared.rows[0]!.afterHash).not.toBe(prepared.rows[0]!.expectedHash);
  expect(prepared.batchHash).not.toBe(prepareDataChangeSet({ ...batch, batchId: "new-review" }).batchHash);
});
