import { describe, it, expect } from "vitest";
import { computeMatchupMatrix, averageWinRates } from "@/domain/combat-lab/analysis/matchup";
import { greedyDamagePolicy } from "@/domain/combat-lab/engine/ai/policy";
import { makeSnapshot, makeOffense } from "@/domain/combat-lab/engine/__tests__/engineFixtures";

const strong = () => makeSnapshot("strong", { offense: makeOffense("s", 4, 8, 10), maxHp: 60, initiativeValue: 5 });
const mid = () => makeSnapshot("mid", { offense: makeOffense("m", 2, 6, 4), maxHp: 45, initiativeValue: 3 });
const weak = () => makeSnapshot("weak", { offense: makeOffense("w", 1, 3, 0), maxHp: 25, initiativeValue: 1 });

describe("computeMatchupMatrix()", () => {
  it("produces an N×N matrix with null diagonal", () => {
    const entries = [strong(), mid(), weak()].map(snapshot => ({ snapshot, policy: greedyDamagePolicy }));
    const matrix = computeMatchupMatrix(entries, { count: 50 });

    expect(matrix.combatants.map(c => c.id)).toEqual(["strong", "mid", "weak"]);
    expect(matrix.winRates).toHaveLength(3);
    for (let i = 0; i < 3; i++) {
      expect(matrix.winRates[i]![i]).toBeNull();
      for (let j = 0; j < 3; j++) {
        if (i !== j) {
          expect(matrix.winRates[i]![j]).toBeGreaterThanOrEqual(0);
          expect(matrix.winRates[i]![j]).toBeLessThanOrEqual(1);
        }
      }
    }
  });

  it("ranks the strong combatant above the weak one by average win rate", () => {
    const entries = [strong(), mid(), weak()].map(snapshot => ({ snapshot, policy: greedyDamagePolicy }));
    const matrix = computeMatchupMatrix(entries, { count: 80 });
    const [avgStrong, , avgWeak] = averageWinRates(matrix);
    expect(avgStrong).toBeGreaterThan(avgWeak!);
  });

  it("reports progress for every ordered pair", () => {
    const entries = [strong(), mid(), weak()].map(snapshot => ({ snapshot }));
    const seen: number[] = [];
    computeMatchupMatrix(entries, { count: 10 }, (done, total) => { seen.push(done); expect(total).toBe(6); });
    expect(seen).toEqual([1, 2, 3, 4, 5, 6]);
  });

  it("is deterministic for the same inputs", () => {
    const build = () => [strong(), weak()].map(snapshot => ({ snapshot, policy: greedyDamagePolicy }));
    const a = computeMatchupMatrix(build(), { count: 40 });
    const b = computeMatchupMatrix(build(), { count: 40 });
    expect(a.winRates).toEqual(b.winRates);
  });
});
