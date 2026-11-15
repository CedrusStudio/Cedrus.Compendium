import { describe, it, expect, vi } from "vitest";
import * as combatEngine from "@/domain/combat-lab/engine/runCombat";
import { runSimulation, runSimulationChunk, splitSeedRange } from "@/domain/combat-lab/simulation/runSimulation";
import { aggregateResults } from "@/domain/combat-lab/simulation/aggregateResults";
import { summarizeCombat } from "@/domain/combat-lab/simulation/summarizeCombat";
import { runCombat } from "@/domain/combat-lab/engine/runCombat";
import { greedyDamagePolicy, basicAttackPolicy } from "@/domain/combat-lab/engine/ai/policy";
import { makeSnapshot, makeOffense } from "@/domain/combat-lab/engine/__tests__/engineFixtures";

const knight = () => makeSnapshot("knight", { offense: makeOffense("k", 2, 6, 4), maxHp: 45, initiativeValue: 3 });
const orc = () => makeSnapshot("orc", { offense: makeOffense("o", 2, 5, 3), maxHp: 40, initiativeValue: 1 });

describe("summarizeCombat()", () => {
  it("extracts winner, rounds and death cause from a decisive fight", () => {
    const strong = makeSnapshot("strong", { offense: makeOffense("s", 4, 8, 10), maxHp: 60, initiativeValue: 5 });
    const weak = makeSnapshot("weak", { offense: makeOffense("w", 1, 2, 0), maxHp: 15 });
    const log = runCombat(strong, weak, { seed: 3 });
    const result = summarizeCombat(log);

    expect(result.winnerId).toBe("strong");
    expect(result.reason).toBe("knockout");
    expect(result.rounds).toBeGreaterThan(0);
    expect(result.deathCause).toBe("weapon");
  });
});

describe("runSimulation()", () => {
  it("is fully deterministic for the same request", () => {
    const request = { a: knight(), b: orc(), count: 200, seedStart: 0, policyA: greedyDamagePolicy, policyB: basicAttackPolicy };
    const run1 = runSimulation(request);
    const run2 = runSimulation(request);
    expect(run1.summary).toEqual(run2.summary);
    expect(run1.results).toEqual(run2.results);
  });

  it("produces win rates that sum to at most 1 with draws accounted for", () => {
    const { summary } = runSimulation({ a: knight(), b: orc(), count: 500 });
    const totalWinFraction = Object.values(summary.winRates).reduce((sum, r) => sum + r, 0);
    const drawFraction = summary.draws / summary.count;
    expect(totalWinFraction + drawFraction).toBeCloseTo(1, 5);
  });

  it("reports progress at the configured interval", () => {
    const updates: number[] = [];
    runSimulation({ a: knight(), b: orc(), count: 1000 }, (completed) => updates.push(completed), 250);
    expect(updates).toContain(250);
    expect(updates).toContain(1000);
  });

  it("reports actual completed work before running the remaining fights", () => {
    const spy = vi.spyOn(combatEngine, 'runCombat');
    try {
      const updates: number[] = [];
      const request = { a: knight(), b: orc(), count: 7, seedStart: 23 };
      const result = runSimulation(request, completed => {
        expect(spy).toHaveBeenCalledTimes(completed);
        updates.push(completed);
      }, 2);
      expect(updates).toEqual([2, 4, 6, 7]);
      const independent = Array.from({ length: 7 }, (_, i) => summarizeCombat(runCombat(request.a, request.b, { seed: 23 + i })));
      expect(result.results).toEqual(independent);
      expect(result.summary).toEqual(aggregateResults(independent));
    } finally { spy.mockRestore(); }
  });

  it.each([0, -1, 1.5, Infinity, NaN])("rejects invalid progress intervals (%s)", interval => {
    expect(() => runSimulation({ a: knight(), b: orc(), count: 1 }, () => {}, interval)).toThrow(RangeError);
  });

  it.each([-1, 1.5, Infinity, NaN])("rejects invalid counts (%s)", count => {
    expect(() => runSimulation({ a: knight(), b: orc(), count })).toThrow(RangeError);
  });

  it("reports an empty run once and prevents unsafe seed ranges", () => {
    const progress = vi.fn();
    expect(runSimulation({ a: knight(), b: orc(), count: 0 }, progress).results).toEqual([]);
    expect(progress).toHaveBeenCalledExactlyOnceWith(0, 0);
    expect(() => runSimulation({ a: knight(), b: orc(), count: 2, seedStart: Number.MAX_SAFE_INTEGER })).toThrow(RangeError);
  });

  it("counts each fight's rounds into the average", () => {
    const { summary } = runSimulation({ a: knight(), b: orc(), count: 100 });
    expect(summary.averageRounds).toBeGreaterThan(0);
    expect(summary.count).toBe(100);
  });
});

describe("chunking and aggregation", () => {
  it("splitSeedRange covers the whole range without gaps or overlap", () => {
    const ranges = splitSeedRange(0, 1000, 4);
    const total = ranges.reduce((sum, r) => sum + r.count, 0);
    expect(total).toBe(1000);
    // contiguous
    for (let i = 1; i < ranges.length; i++) {
      expect(ranges[i]!.seedStart).toBe(ranges[i - 1]!.seedStart + ranges[i - 1]!.count);
    }
  });

  it("aggregating merged chunks equals a single full run", () => {
    const base = { a: knight(), b: orc() };
    const full = runSimulation({ ...base, count: 400, seedStart: 0 });

    const ranges = splitSeedRange(0, 400, 3);
    const merged = ranges.flatMap(range => runSimulationChunk({ ...base, count: range.count, seedStart: range.seedStart }));
    const mergedSummary = aggregateResults(merged);

    expect(mergedSummary).toEqual(full.summary);
  });

  it("handles more chunks than fights", () => {
    const ranges = splitSeedRange(10, 2, 8);
    expect(ranges.reduce((sum, r) => sum + r.count, 0)).toBe(2);
  });
});
