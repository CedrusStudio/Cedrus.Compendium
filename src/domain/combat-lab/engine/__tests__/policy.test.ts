import { describe, it, expect } from "vitest";
import { greedyDamagePolicy } from "@/domain/combat-lab/engine/ai/policy";
import { createRuntime } from "@/domain/combat-lab/engine/CombatState";
import { makeSnapshot, makeOffense } from "@/domain/combat-lab/engine/__tests__/engineFixtures";
import type { Action } from "@/domain/combat-lab/engine/actionEconomy";
import type { Effect } from "@/domain/combat-lab/effects/Effect";
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
