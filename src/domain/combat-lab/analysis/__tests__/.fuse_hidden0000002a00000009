import { describe, it, expect } from "vitest";
import { computeRawProfile, computeBalanceReport, BALANCE_DIMENSIONS } from "@/domain/combat-lab/analysis/balance";
import { makeSnapshot, makeOffense, makeDefense } from "@/domain/combat-lab/engine/__tests__/engineFixtures";
import type { ManeuverDefinition } from "@/domain/combat-lab/effects/ManeuverDefinition";

const maneuver = (id: string, effects: ManeuverDefinition["effects"]): ManeuverDefinition => ({
  id, name: id, grade: 1, description: "", requirements: [], price: 1, tags: [],
  castTime: "Standardowa", cooldown: 0, cost: { castTime: "Standardowa" }, hardRequirements: [], effects,
});

describe("computeRawProfile()", () => {
  it("scores damage from offense and maneuver damage effects", () => {
    const withManeuver = makeSnapshot("a", {
      offense: makeOffense("ao", 2, 6, 4),
      maneuvers: [maneuver("m", [{ type: "damage", damage: { amount: 0, grade: 0, bonus: 20 }, damageType: "zwyczajne" }])],
    });
    const bare = makeSnapshot("b", { offense: makeOffense("bo", 2, 6, 4) });
    expect(computeRawProfile(withManeuver).damage).toBeGreaterThan(computeRawProfile(bare).damage);
  });

  it("scores survivability from hp, barrier and reduction", () => {
    const tanky = makeSnapshot("t", { maxHp: 80, barrier: 10, defense: makeDefense("td", { block: 5, protection: 3 }) });
    const frail = makeSnapshot("f", { maxHp: 30 });
    expect(computeRawProfile(tanky).survivability).toBeGreaterThan(computeRawProfile(frail).survivability);
  });

  it("scores control from control effects", () => {
    const controller = makeSnapshot("c", { maneuvers: [maneuver("stun", [{ type: "control", control: "stun", duration: 2 }])] });
    expect(computeRawProfile(controller).control).toBeGreaterThan(0);
  });

  it("scores utility from heal/buff effects", () => {
    const support = makeSnapshot("s", { maneuvers: [maneuver("heal", [{ type: "heal", amount: { amount: 0, grade: 0, bonus: 10 } }])] });
    expect(computeRawProfile(support).utility).toBeGreaterThan(0);
  });
});

describe("computeBalanceReport()", () => {
  it("normalizes to 0–100 per dimension and ranks by score", () => {
    const strong = makeSnapshot("strong", { offense: makeOffense("s", 4, 8, 10), maxHp: 80, barrier: 10 });
    const weak = makeSnapshot("weak", { offense: makeOffense("w", 1, 3, 0), maxHp: 25 });
    const report = computeBalanceReport([strong, weak]);

    // ranked, strong first
    expect(report.entries[0]!.id).toBe("strong");

    // every normalized value within [0, 100]
    for (const entry of report.entries) {
      for (const dim of BALANCE_DIMENSIONS) {
        expect(entry.normalized[dim]).toBeGreaterThanOrEqual(0);
        expect(entry.normalized[dim]).toBeLessThanOrEqual(100);
      }
    }

    // the roster leader in a dimension hits 100 there
    const maxDamage = Math.max(...report.entries.map(e => e.normalized.damage));
    expect(maxDamage).toBe(100);
  });

  it("handles a single combatant (its own max = 100)", () => {
    const only = makeSnapshot("only", { offense: makeOffense("o", 2, 6, 4) });
    const report = computeBalanceReport([only]);
    expect(report.entries[0]!.normalized.damage).toBe(100);
  });
});
