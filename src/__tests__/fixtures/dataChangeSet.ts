import { reviewSnapshot, type DataChangeSet } from "@/domain/data-quality/dataChangeSet";

export function reviewRecords(): Record<string, unknown>[]
{
  return ["01ARZ3NDEKTSV4RRFFQ69G5FAV", "01ARZ3NDEKTSV4RRFFQ69G5FAW"].map((id, index) => ({
    id, name: `Test maneuver ${index}`, grade: 1, description: `Original ${index}`,
    price: 1, tags: [], structuredRequirements: null, replaces: [],
    castTime: "Standardowa", cooldown: 0, effects: null, simulatable: null, unsupportedReason: null,
  }));
}

/** Synthetic approvals only; never used to label production content reviewed. */
export function approvedReview(records = reviewRecords()): DataChangeSet
{
  return {
    schemaVersion: 1, batchId: "test-review",
    source: { exportCreatedAt: "2026-11-15T18:38:23.881Z", sourceRevision: "a".repeat(40) },
    rows: records.map((record, index) =>
    {
      const before = reviewSnapshot(record);
      return {
        reviewId: `test-${index}`, collection: "Maneuver", id: String(record.id),
        identityAssertions: { name: String(record.name), grade: Number(record.grade) },
        expectedHash: before.hash, before: before.content, context: before.context,
        proposed: { description: `Corrected ${index}` }, changeKind: "editorial", reviewState: "ready",
        issues: [], mechanics: { summary: "Synthetic editorial fixture", unknowns: [] },
        review: { content: { reviewer: "test-content", decision: "approved", evidence: "fixture" }, application: { reviewer: "test-application", decision: "approved", evidence: "fixture" }, acceptedRule: "synthetic fixture" },
        verification: { schemaRevision: "a".repeat(40), engineRevision: "a".repeat(40), checks: [{ name: "schema fixture", kind: "schema", result: "PASS", evidence: "synthetic fixture" }] },
      };
    }),
  };
}
