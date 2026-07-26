import { describe, it, expect } from "vitest";
import { resolveAttack } from "@/domain/combat-lab/engine/resolveAttack";
import { statEffectToProfile } from "@/domain/combat-lab/effects/statBuff";
import { makeSnapshot } from "@/domain/combat-lab/engine/__tests__/engineFixtures";
import type { Offense } from "@/domain/characters/combat/Offense";
import type { StatBuffEffect } from "@/domain/combat-lab/effects/Effect";

const critOffense: Offense = {
  id: "crit", name: "crit",
  leadingWeapon: { amount: 1, grade: 4, bonus: 0, isPhantom: false, critical: { power: 10, range: 8 } },
  secondaryWeapon: undefined,
  damageBonus: { amount: 0, grade: 0, bonus: 0, isPhantom: false },
  additionalDamageBonus: undefined,
};

// random()≈1 → roll = grade*2 = 8 (always in the crit window for range 8).
const maxRng = () => 0.999;

describe("crit as a stat", () =>
{
  it("maps critRange onto the buff profile's weapon crit range", () =>
  {
    const effect: StatBuffEffect = { type: "stat", mode: "self", duration: 1, critRange: 3 };
    const profile = statEffectToProfile(effect);
    expect(profile.offense.leadingWeapon.criticalRange).toBe(3);
  });

  it("suppressCrit removes the critical bonus from an attack", () =>
  {
    const attacker = { ...makeSnapshot("a"), offenses: [critOffense], defaultOffenseId: "crit" };
    const defender = makeSnapshot("d");

    const normal = resolveAttack(attacker, defender, maxRng, {});
    const suppressed = resolveAttack(attacker, defender, maxRng, { suppressCrit: true });

    expect(normal.critical).toBe(true);
    expect(suppressed.critical).toBe(false);
    expect(normal.dealt).toBe(suppressed.dealt + 10); // crit power was 10
  });
});
