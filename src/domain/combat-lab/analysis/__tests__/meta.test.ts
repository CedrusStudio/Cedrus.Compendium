import { describe, it, expect } from "vitest";
import { computeMeta } from "@/domain/combat-lab/analysis/meta";
import { greedyDamagePolicy, basicAttackPolicy } from "@/domain/combat-lab/engine/ai/policy";
import { makeSnapshot, makeOffense } from "@/domain/combat-lab/engine/__tests__/engineFixtures";
import type { ManeuverDefinition } from "@/domain/combat-lab/effects/ManeuverDefinition";
import type { MatchupEntry } from "@/domain/combat-lab/analysis/matchup";

const damageManeuver = (id: string, bonus: number): ManeuverDefinition => ({
  id, name: id, grade: 1, description: "", price: 1, tags: [],
  castTime: "Standardowa", cooldown: 0, cost: { castTime: "Standardowa" }, hardRequirements: [],
  effects: [{ type: "damage", damage: { amount: 0, grade: 0, bonus }, damageType: "nieuchronne" }],
});

// A maneuver with NO damage value — greedy's damageScore is 0 (== pass), so a
// greedy combatant never picks it (the proactive phase offers pass + maneuvers).
const noDamageManeuver = (id: string): ManeuverDefinition => ({
  id, name: id, grade: 1, description: "", price: 1, tags: [],
  castTime: "Standardowa", cooldown: 0, cost: { castTime: "Standardowa" }, hardRequirements: [],
  effects: [{ type: "control", control: "root", duration: 1 }],
});

const strong = () => makeSnapshot("strong", { offense: makeOffense("s", 4, 8, 10), maxHp: 60, initiativeValue: 5 });
const mid = () => makeSnapshot("mid", { offense: makeOffense("m", 2, 6, 4), maxHp: 45, initiativeValue: 3 });
const weak = () => makeSnapshot("weak", { offense: makeOffense("w", 1, 3, 0), maxHp: 25, initiativeValue: 1 });

describe("computeMeta()", () => {
  it("ranks the strongest build on top by average win rate", () => {
    const entries: MatchupEntry[] = [strong(), mid(), weak()].map(snapshot => ({ snapshot, policy: greedyDamagePolicy }));
    const report = computeMeta(entries, { count: 60 });
    expect(report.ranking[0]!.id).toBe("strong");
    expect(report.ranking.at(-1)!.id).toBe("weak");
    expect(report.totalFights).toBe(3 * 2 * 60);
  });

  it("collects used maneuvers and flags never-used ones", () => {
    const user = makeSnapshot("user", { offense: makeOffense("uo", 1, 3, 0), maneuvers: [damageManeuver("Burst", 20)], initiativeValue: 5, maxHp: 40 });
    const bystander = makeSnapshot("bystander", { offense: makeOffense("bo", 2, 6, 4), maneuvers: [noDamageManeuver("NeverUsed")], maxHp: 40 });
    const entries: MatchupEntry[] = [user, bystander].map(snapshot => ({ snapshot, policy: greedyDamagePolicy }));

    const report = computeMeta(entries, { count: 80 });
    expect(report.mostUsedManeuvers.some(m => m.name === "Burst" && m.count > 0)).toBe(true);
    // "NeverUsed" deals no damage → greedy's damageScore is 0 (== pass) → never picked
    expect(report.neverUsedManeuvers).toContain("NeverUsed");
  });

  it("collects cast spells and flags never-cast ones", () => {
    const caster = {
      ...makeSnapshot("caster", { offense: makeOffense("co", 1, 3, 0), maxHp: 50, initiativeValue: 5 }),
      spells: [{ id: "fb", name: "Fireball", offense: makeOffense("fb-off", 4, 8, 10), costEssence: 0, castTime: "Standardowa" as const, cooldown: 0 }],
      startingResources: { essence: 1000 },
    };
    const target = makeSnapshot("target", { offense: makeOffense("to", 2, 6, 4), maxHp: 40 });
    const entries: MatchupEntry[] = [caster, target].map(snapshot => ({ snapshot, policy: greedyDamagePolicy }));

    const report = computeMeta(entries, { count: 60 });
    expect(report.mostUsedSpells.some(s => s.name === "Fireball" && s.count > 0)).toBe(true);
    expect(report.neverUsedSpells).not.toContain("Fireball");
  });

  it("reports progress for every ordered pair and is deterministic", () => {
    const entries: MatchupEntry[] = [strong(), weak()].map(snapshot => ({ snapshot, policy: basicAttackPolicy }));
    const seen: number[] = [];
    const a = computeMeta(entries, { count: 30 }, (d, t) => { seen.push(d); expect(t).toBe(2); });
    const b = computeMeta([strong(), weak()].map(snapshot => ({ snapshot, policy: basicAttackPolicy })), { count: 30 });
    expect(seen).toEqual([1, 2]);
    expect(a.ranking).toEqual(b.ranking);
  });
});
