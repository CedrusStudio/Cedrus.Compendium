import { expect, it } from "vitest";
import { preparePilotReview } from "../pilotReview";
import { prepareDataChangeSet } from "../dataChangeSet";

function sourceRecords()
{
  let id = 0;
  const record = (name: string, grade: number, description: string, extra = {}): Record<string, unknown> => ({
    id: (++id).toString(16).toUpperCase().padStart(26, "0"), name, grade, description,
    price: 1, tags: [], structuredRequirements: null, replaces: [], effects: null, simulatable: null, unsupportedReason: null,
    characterIds: ["private-character"], ...extra,
  });
  return new Map([
    ["Maneuver", [
      ...[1, 2, 3].map(grade => record("Koci Instynkt", grade, `Dodaje 1 niewrażliwości${grade === 1 ? "" : " i"} ${grade} odporności.`, { effects: [{ type: "stat", mode: "self", duration: 1, immunity: 1 }], simulatable: true })),
      ...[1, 2, 3].map(grade => record("Stadne Wycie", grade, `Dodaje 1 odporności${grade === 1 ? "" : ` i ${grade - 1} redukcji`} każdemu ze stada. Tylko jedno na rundę.`, { effects: [{ type: "stat", mode: "self", duration: 1, resistance: 1 }], simulatable: true })),
    ]],
    ["Stance", [1, 2, 4, 6, 8, 11].map((resistance, index) => record("Postawa Defensywna", index + 1, `Zwiększa odporność o ${resistance}, zmniejsza obrażenia o ${index + 1}.`))],
    ["State", [record("Ostrość Umysłu", 1, "Dodaje +2 do obrażeń.")]],
  ]);
}
const source = { exportCreatedAt: "2026-11-15T18:38:23.881Z", sourceRevision: "a".repeat(40) };

it("creates 13 review-blocked proposals without private relations, preserving nonlinear ranks", () =>
{
  const records = sourceRecords();
  const before = JSON.stringify([...records]);
  const batch = preparePilotReview(records, source);
  expect(batch.rows).toHaveLength(13);
  expect(batch.rows.filter(row => row.reviewState === "needs-decision")).toHaveLength(6);
  expect(batch.rows.every(row => row.review.content.decision === "pending" && row.review.application.decision === "pending")).toBe(true);
  expect(JSON.stringify(batch)).not.toContain("private-character");
  expect(JSON.stringify([...records])).toBe(before);
  const ranks = batch.rows.filter(row => row.collection === "Stance");
  expect(ranks.map(row => row.proposed.effects)).toEqual([1, 2, 4, 6, 8, 11].map((resistance, index) => [{ type: "stat", mode: "self", duration: 0, resistance, damage: -(index + 1) }]));
  expect(() => prepareDataChangeSet(batch)).toThrow("Review is not ready");
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
