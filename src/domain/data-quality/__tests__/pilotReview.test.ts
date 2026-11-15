import { expect, it } from "vitest";
import { preparePilotReview } from "../pilotReview";
import { prepareDataChangeSet } from "../dataChangeSet";

import { pilotReviewSourceRecords as sourceRecords } from "@/__tests__/fixtures/pilotReview";

const source = { exportCreatedAt: "2026-11-15T18:38:23.881Z", sourceRevision: "a".repeat(40) };

it("creates 13 review-blocked proposals without private relations, preserving nonlinear ranks", () =>
{
  const records = sourceRecords();
  const before = JSON.stringify([...records]);
  const batch = preparePilotReview(records, source);
  expect(batch.rows).toHaveLength(13);
  expect(batch.rows.every(row => row.reviewState === "needs-decision" && row.mechanics.unknowns.length > 0)).toBe(true);
  expect(batch.rows.every(row => row.review.content.decision === "pending" && row.review.application.decision === "pending")).toBe(true);
  expect(JSON.stringify(batch)).not.toContain("private-character");
  expect(JSON.stringify([...records])).toBe(before);
  const ranks = batch.rows.filter(row => row.collection === "Stance");
  expect(ranks.map(row => row.proposed.effects)).toEqual([1, 2, 4, 6, 8, 11].map((resistance, index) => [{ type: "stat", mode: "self", duration: 0, resistance, damage: -(index + 1) }]));
  expect(() => prepareDataChangeSet(batch)).toThrow("Review is not ready");
  expect(batch.rows.every(row => row.verification.checks.some(check => check.kind === "engine" && check.result === "NOT_RUN"))).toBe(true);
});

it("keeps withdrawal explicit and retains original incomplete effects for rollback", () =>
{
  const batch = preparePilotReview(sourceRecords(), source);
  const withdrawal = batch.rows.find(row => row.identityAssertions.name === "Stadne Wycie")!;
  expect(withdrawal.before.effects).toEqual([{ type: "stat", mode: "self", duration: 1, resistance: 1 }]);
  expect(withdrawal.proposed).toMatchObject({ effects: [], simulatable: false });
  expect(withdrawal.mechanics.unknowns).toHaveLength(2);
});

it("refuses changed wording, existing new mappings and incomplete rank families", () =>
{
  const changed = sourceRecords();
  changed.get("Maneuver")![0]!.description = "Dodaje 1 niewrażliwości 3 odporności.";
  expect(() => preparePilotReview(changed, source)).toThrow("source mapping changed");
  const incomplete = sourceRecords(); incomplete.get("Stance")!.pop();
  expect(() => preparePilotReview(incomplete, source)).toThrow("inventory changed");
  const assessed = sourceRecords(); assessed.get("Stance")![0]!.simulatable = true;
  expect(() => preparePilotReview(assessed, source)).toThrow("already assessed");
});
