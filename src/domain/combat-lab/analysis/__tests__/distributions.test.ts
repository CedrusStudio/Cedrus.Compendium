import { describe, it, expect } from "vitest";
import { computeStatistics } from "@/domain/combat-lab/analysis/distributions";
import { runSimulation } from "@/domain/combat-lab/simulation/runSimulation";
import { greedyDamagePolicy, basicAttackPolicy } from "@/domain/combat-lab/engine/ai/policy";
import { makeSnapshot, makeOffense } from "@/domain/combat-lab/engine/__tests__/engineFixtures";
import type { RawResult } from "@/domain/combat-lab/simulation/RawResult";

function fakeResult(over: Partial<RawResult>): RawResult {
  return {
    seed: 0, winnerId: "a", reason: "knockout", rounds: 3, winnerRemainingHp: 10,
    deathCause: "weapon", maneuverUsage: {}, schemaVersion: 1, ...over,
  };
}

describe("computeStatistics()", () => {
  it("groups rounds ascending and counts them", () => {
    const results = [fakeResult({ rounds: 2 }), fakeResult({ rounds: 2 }), fakeResult({ rounds: 5 })];
    const stats = computeStatistics(results);
    expect(stats.rounds).toEqual([{ label: "2", count: 2 }, { label: "5", count: 1 }]);
    expect(stats.total).toBe(3);
  });

  it("counts death causes and end reasons", () => {
    const results = [
      fakeResult({ deathCause: "weapon", reason: "knockout" }),
      fakeResult({ deathCause: "bleeding", reason: "knockout" }),
      fakeResult({ deathCause: "weapon", reason: "timeout", winnerId: null }),
    ];
    const stats = computeStatistics(results);
    expect(stats.deathCauses.find(b => b.label === "weapon")?.count).toBe(2);
    expect(stats.reasons.find(b => b.label === "knockout")?.count).toBe(2);
    expect(stats.reasons.find(b => b.label === "timeout")?.count).toBe(1);
  });

  it("ranks maneuver usage descending and caps at topN", () => {
    const results = [
      fakeResult({ maneuverUsage: { A: 3, B: 1 } }),
      fakeResult({ maneuverUsage: { A: 2, C: 5 } }),
    ];
    const stats = computeStatistics(results, 2);
    expect(stats.maneuverUsage).toEqual([{ label: "A", count: 5 }, { label: "C", count: 5 }]);
  });

  it("bins winner hp into ranges", () => {
    const results = Array.from({ length: 10 }, (_, i) => fakeResult({ winnerRemainingHp: i * 10 }));
    const stats = computeStatistics(results);
    expect(stats.winnerHp.reduce((sum, b) => sum + b.count, 0)).toBe(10);
  });

  it("works end-to-end on a real run's results", () => {
    const a = makeSnapshot("a", { offense: makeOffense("ao", 3, 6, 5), maxHp: 50, initiativeValue: 3 });
    const b = makeSnapshot("b", { offense: makeOffense("bo", 2, 5, 2), maxHp: 40 });
    const { results } = runSimulation({ a, b, count: 100, policyA: greedyDamagePolicy, policyB: basicAttackPolicy });
    const stats = computeStatistics(results);
    expect(stats.total).toBe(100);
    expect(stats.rounds.length).toBeGreaterThan(0);
  });
});
