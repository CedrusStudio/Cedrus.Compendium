import { describe, it, expect } from "vitest";
import { countScaleSource, resolveDamageSpecGrade } from "@/domain/combat-lab/engine/scaleSource";
import { createRuntime } from "@/domain/combat-lab/engine/CombatState";
import { makeSnapshot } from "@/domain/combat-lab/engine/__tests__/engineFixtures";

describe("scale sources from a statistic (dynamic values)", () =>
{
  const self = createRuntime(makeSnapshot("A", { characteristics: { strength: { grade: 3, value: 4, bonus: 1, testBonus: 9 } } }));
  const opp = createRuntime(makeSnapshot("B", { characteristics: { mind: { grade: 3, value: 3, bonus: 0, testBonus: 0 } } }));

  it("reads the caster's stat magnitude (value + bonus, ignoring testBonus)", () =>
  {
    expect(countScaleSource({ kind: "selfStat", group: "characteristics", key: "strength" }, self, opp)).toBe(5);
  });

  it("reads the opponent's stat magnitude", () =>
  {
    expect(countScaleSource({ kind: "opponentStat", group: "characteristics", key: "mind" }, self, opp)).toBe(3);
  });

  it("is 0 for an unset stat", () =>
  {
    expect(countScaleSource({ kind: "selfStat", group: "attributes", key: "fencing" }, self, opp)).toBe(0);
  });

  it("resolveDamageSpecGrade binds the die rank to a statistic (floored ≥ 1)", () =>
  {
    const spec = { amount: 1, grade: 0, bonus: 0, gradeFromStat: { group: "characteristics" as const, key: "strength" } };
    expect(resolveDamageSpecGrade(spec, self, opp).grade).toBe(5); // self strength magnitude
    const oppSpec = { ...spec, gradeFromStat: { group: "characteristics" as const, key: "mind", who: "target" as const } };
    expect(resolveDamageSpecGrade(oppSpec, self, opp).grade).toBe(3);
    // Unset stat → floored to 1 (never a 0-grade die).
    const zeroSpec = { ...spec, gradeFromStat: { group: "attributes" as const, key: "fencing" } };
    expect(resolveDamageSpecGrade(zeroSpec, self, opp).grade).toBe(1);
    // Plain spec is untouched.
    expect(resolveDamageSpecGrade({ amount: 1, grade: 4, bonus: 0 }, self, opp).grade).toBe(4);
  });
});
