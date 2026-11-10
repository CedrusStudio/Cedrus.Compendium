import { describe, it, expect } from "vitest";
import { greedyDamagePolicy } from "@/domain/combat-lab/engine/ai/policy";
import { createRuntime } from "@/domain/combat-lab/engine/CombatState";
import { makeSnapshot, makeOffense } from "@/domain/combat-lab/engine/__tests__/engineFixtures";
import type { Action } from "@/domain/combat-lab/engine/actionEconomy";
import type { Effect, SaveTestEffect, TestSide } from "@/domain/combat-lab/effects/Effect";
import { expectedManeuverValue } from "@/domain/combat-lab/engine/ai/policyValue";
import { createDefaultBuffProfile } from "@/domain/characters/buffs/BuffProfile";
import type { ManeuverDefinition } from "@/domain/combat-lab/effects/ManeuverDefinition";

const maneuver = (id: string, effects: Effect[]): ManeuverDefinition => ({
  id, name: id, grade: 1, description: "", price: 1, tags: [],
  castTime: "Standardowa", cooldown: 1, cost: { castTime: "Standardowa" }, hardRequirements: [], effects,
});

describe("greedyDamagePolicy", () => {
  it("uses a self-buff maneuver that raises this turn's attack", () => {
    const self = createRuntime(makeSnapshot("A", { offense: makeOffense("o", 2, 5, 0) }));
    const opponent = createRuntime(makeSnapshot("B"));
    const buff = maneuver("Ostrze", [{ type: "stat", mode: "self", duration: 1, damage: 5 }]);
    const available: Action[] = [{ kind: "pass" }, { kind: "maneuver", maneuver: buff }];
    expect(greedyDamagePolicy.chooseAction(self, opponent, available).kind).toBe("maneuver");
  });

  it("declines a pure-control maneuver (no damage, no attack gain)", () => {
    const self = createRuntime(makeSnapshot("A"));
    const opponent = createRuntime(makeSnapshot("B"));
    const control = maneuver("Więzy", [{ type: "control", control: "root", duration: 1 }]);
    const available: Action[] = [{ kind: "pass" }, { kind: "maneuver", maneuver: control }];
    expect(greedyDamagePolicy.chooseAction(self, opponent, available).kind).toBe("pass");
  });
});

describe("expectedManeuverValue", () => {
  const damage: Effect = { type: "damage", damage: { amount: 0, grade: 0, bonus: 8 }, damageType: "zwyczajne" };

  function combatants()
  {
    return {
      self: createRuntime(makeSnapshot("A", { maxHp: 20, offense: makeOffense("self", 0, 0, 10) })),
      opponent: createRuntime(makeSnapshot("B", {
        offense: makeOffense("target", 0, 0, 20),
        attributes: { fortitude: { value: 10, grade: 3, bonus: 0, testBonus: 0 } },
      })),
    };
  }

  it("credits healing only up to missing health", () => {
    const { self, opponent } = combatants();
    const heal: Effect = { type: "heal", amount: { amount: 1, grade: 3, bonus: 3 } };
    expect(expectedManeuverValue(self, opponent, [heal])).toBe(0);
    self.currentHp = 17;
    expect(expectedManeuverValue(self, opponent, [heal])).toBe(3);
    self.currentHp = 10;
    expect(expectedManeuverValue(self, opponent, [heal])).toBe(6.5);
  });

  it("scales damage ticks by duration and values action denial against the opponent's damage", () => {
    const { self, opponent } = combatants();
    expect(expectedManeuverValue(self, opponent, [{
      type: "status", status: "poisoned", duration: 3,
      tick: { damage: { amount: 0, grade: 0, bonus: 2 }, damageType: "śmiertelne" },
    }])).toBe(6);
    expect(expectedManeuverValue(self, opponent, [
      { type: "status", status: "stagger", duration: 0 },
      { type: "control", control: "disarm", duration: 2 },
    ])).toBe(38);
  });

  it("weights nested damage by its chance, condition and capped scale", () => {
    const { self, opponent } = combatants();
    self.resources.essence = 9;
    expect(expectedManeuverValue(self, opponent, [{
      type: "chance", chance: 25, then: [{
        type: "when", condition: { kind: "onCritical" }, then: [{
          type: "scale", source: { kind: "selfResource", resource: "essence" }, per: 2, cap: 3, effect: damage,
        }],
      }],
    }])).toBe(3);
  });

  it("distinguishes the attacker and recipient of damage multipliers", () => {
    const { self, opponent } = combatants();
    const cases: [Effect, number][] = [
      [{ type: "multiplier", target: "damageDealt", mode: "self", factor: 1.5, duration: 2 }, 10],
      [{ type: "multiplier", target: "damageDealt", mode: "target", factor: 0.5, duration: 2 }, 20],
      [{ type: "multiplier", target: "damageTaken", mode: "self", factor: 0.5, duration: 2 }, 20],
      [{ type: "multiplier", target: "damageTaken", mode: "target", factor: 1.5, duration: 2 }, 10],
    ];
    for (const [effect, expected] of cases) {
      expect(expectedManeuverValue(self, opponent, [effect]), JSON.stringify(effect)).toBe(expected);
    }
  });

  it("uses different skill pools for own and enemy saves and caps opposed-test probabilities", () => {
    const { self, opponent } = combatants();
    const fortitude: TestSide = { pool: [{ anyOf: [{ group: "attributes", key: "fortitude" }] }] };
    const save: SaveTestEffect = { type: "save", pool: fortitude, st: 14, onFail: [damage] };
    expect(expectedManeuverValue(self, opponent, [save])).toBeCloseTo(4.2);
    expect(expectedManeuverValue(self, opponent, [{ ...save, who: "self" }])).toBe(8);
    expect(expectedManeuverValue(self, opponent, [{
      type: "contested", attacker: { ...fortitude, modifier: -20 }, defender: fortitude, onWin: [damage],
    }])).toBe(0);
    expect(expectedManeuverValue(self, opponent, [{
      type: "contested", attacker: { ...fortitude, modifier: 30 }, defender: fortitude, onWin: [damage],
    }])).toBe(8);
  });

  it("values protection and vulnerability through the caster's matching buff profiles", () => {
    const { self, opponent } = combatants();
    const protection = { ...createDefaultBuffProfile(), id: "protection" };
    protection.defense.block = 30;
    const vulnerability = { ...createDefaultBuffProfile(), id: "vulnerability" };
    vulnerability.defense.protection = -5;
    self.snapshot.buffProfiles.push(protection, vulnerability);

    expect(expectedManeuverValue(self, opponent, [
      { type: "buff", profile: { profileId: protection.id }, duration: 2 },
      { type: "debuff", profile: { profileId: vulnerability.id }, duration: 3 },
      { type: "buff", profile: { profileId: "missing" }, duration: 9 },
      { type: "debuff", profile: { profileId: "missing" }, duration: 9 },
    ])).toBe(55);
  });

  it("credits extra dice and advantage without rewarding disadvantage", () => {
    const { self, opponent } = combatants();
    expect(expectedManeuverValue(self, opponent, [
      { type: "roll", modifier: "extraDie" },
      { type: "roll", modifier: "extraDie", grade: 4 },
      { type: "roll", modifier: "advantage" },
      { type: "roll", modifier: "disadvantage" },
    ])).toBe(10);
  });
});
