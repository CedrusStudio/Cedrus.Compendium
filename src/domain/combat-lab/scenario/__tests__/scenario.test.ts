import { describe, it, expect } from "vitest";
import { applyScenario, compareScenarios, SCENARIO_PRESETS } from "@/domain/combat-lab/scenario/scenario";
import { greedyDamagePolicy } from "@/domain/combat-lab/engine/ai/policy";
import { makeSnapshot, makeOffense } from "@/domain/combat-lab/engine/__tests__/engineFixtures";

const boss = SCENARIO_PRESETS.find(s => s.id === "boss")!;
const arena = SCENARIO_PRESETS.find(s => s.id === "arena")!;

describe("applyScenario()", () => {
  it("arena leaves the snapshots unchanged and sets normal distance", () => {
    const a = makeSnapshot("a", { maxHp: 40 });
    const b = makeSnapshot("b", { maxHp: 40 });
    const applied = applyScenario(a, b, arena);
    expect(applied.a.maxHp).toBe(40);
    expect(applied.b.maxHp).toBe(40);
    expect(applied.distanceST).toBe(5);
  });

  it("boss triples B's hp and keeps A's", () => {
    const a = makeSnapshot("a", { maxHp: 40 });
    const b = makeSnapshot("b", { maxHp: 50 });
    const applied = applyScenario(a, b, boss);
    expect(applied.a.maxHp).toBe(40);
    expect(applied.b.maxHp).toBe(150);
  });

  it("does not mutate the input snapshots", () => {
    const b = makeSnapshot("b", { maxHp: 50 });
    applyScenario(makeSnapshot("a"), b, boss);
    expect(b.maxHp).toBe(50);
  });
});

describe("compareScenarios()", () => {
  it("produces a row per scenario with win rates and reports progress", () => {
    const a = makeSnapshot("a", { offense: makeOffense("ao", 2, 6, 4), maxHp: 45, initiativeValue: 3 });
    const b = makeSnapshot("b", { offense: makeOffense("bo", 2, 5, 2), maxHp: 40 });

    const seen: number[] = [];
    const report = compareScenarios(a, b, SCENARIO_PRESETS, { count: 60, policyA: greedyDamagePolicy, policyB: greedyDamagePolicy }, (d, t) => { seen.push(d); expect(t).toBe(SCENARIO_PRESETS.length); });

    expect(report.rows).toHaveLength(SCENARIO_PRESETS.length);
    for (const row of report.rows) {
      expect(row.winRateA).toBeGreaterThanOrEqual(0);
      expect(row.winRateA).toBeLessThanOrEqual(1);
    }
    expect(seen).toEqual(SCENARIO_PRESETS.map((_, i) => i + 1));
  });

  it("boss scenario lowers A's win rate vs the arena baseline", () => {
    const a = makeSnapshot("a", { offense: makeOffense("ao", 2, 6, 4), maxHp: 45, initiativeValue: 3 });
    const b = makeSnapshot("b", { offense: makeOffense("bo", 2, 5, 2), maxHp: 40 });
    const report = compareScenarios(a, b, [arena, boss], { count: 120, policyA: greedyDamagePolicy, policyB: greedyDamagePolicy });
    const arenaRow = report.rows.find(r => r.scenarioId === "arena")!;
    const bossRow = report.rows.find(r => r.scenarioId === "boss")!;
    expect(bossRow.winRateA).toBeLessThan(arenaRow.winRateA);
  });
});
