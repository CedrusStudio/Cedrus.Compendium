import { describe, it, expect } from "vitest";
import { applyOverrides, compareTuning, NO_OVERRIDES } from "@/domain/combat-lab/tuning/parameters";
import { expectedOffenseDamage } from "@/domain/combat-lab/engine/ai/expectedDamage";
import { selectDefaultOffense } from "@/domain/combat-lab/engine/CombatantSnapshot";
import { greedyDamagePolicy, basicAttackPolicy } from "@/domain/combat-lab/engine/ai/policy";
import { makeSnapshot, makeOffense } from "@/domain/combat-lab/engine/__tests__/engineFixtures";

describe("applyOverrides()", () => {
  it("raises offense damage by the flat bonus", () => {
    const snapshot = makeSnapshot("a", { offense: makeOffense("ao", 1, 3, 0) });
    const before = expectedOffenseDamage(selectDefaultOffense(snapshot)!);
    const tuned = applyOverrides(snapshot, { ...NO_OVERRIDES, damageBonus: 10 });
    const after = expectedOffenseDamage(selectDefaultOffense(tuned)!);
    expect(after).toBeCloseTo(before + 10);
  });

  it("raises max hp and never drops below 1", () => {
    const snapshot = makeSnapshot("a", { maxHp: 30 });
    expect(applyOverrides(snapshot, { ...NO_OVERRIDES, hp: 20 }).maxHp).toBe(50);
    expect(applyOverrides(snapshot, { ...NO_OVERRIDES, hp: -100 }).maxHp).toBe(1);
  });

  it("does not mutate the original snapshot", () => {
    const snapshot = makeSnapshot("a", { offense: makeOffense("ao", 1, 3, 5) });
    const originalBonus = snapshot.offenses[0]!.leadingWeapon.bonus;
    applyOverrides(snapshot, { ...NO_OVERRIDES, damageBonus: 99 });
    expect(snapshot.offenses[0]!.leadingWeapon.bonus).toBe(originalBonus);
  });
});

describe("compareTuning()", () => {
  it("a damage buff raises the subject's win rate (delta > 0)", () => {
    const subject = makeSnapshot("subject", { offense: makeOffense("so", 1, 4, 0), maxHp: 40, initiativeValue: 3 });
    const opponent = makeSnapshot("opponent", { offense: makeOffense("oo", 1, 4, 0), maxHp: 40 });

    const result = compareTuning(subject, opponent, { ...NO_OVERRIDES, damageBonus: 12 }, {
      count: 200, subjectPolicy: greedyDamagePolicy, opponentPolicy: basicAttackPolicy,
    });

    expect(result.tuned.winRate).toBeGreaterThan(result.baseline.winRate);
    expect(result.winRateDelta).toBeGreaterThan(0);
  });

  it("no overrides give a near-zero delta (same as baseline)", () => {
    const subject = makeSnapshot("s", { offense: makeOffense("so", 2, 5, 2), initiativeValue: 2 });
    const opponent = makeSnapshot("o", { offense: makeOffense("oo", 2, 5, 2) });
    const result = compareTuning(subject, opponent, NO_OVERRIDES, { count: 150 });
    expect(result.winRateDelta).toBeCloseTo(0, 10);
  });
});
