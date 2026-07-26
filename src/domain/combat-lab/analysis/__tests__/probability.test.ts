import { describe, it, expect } from "vitest";
import { explore, type ProbabilityConfig } from "@/domain/combat-lab/analysis/probability";
import { makeOffense, makeDefense } from "@/domain/combat-lab/engine/__tests__/engineFixtures";
import type { Statistic } from "@/domain/characters/statistics/Statistic";

const stat = (value: number, grade = 3): Statistic => ({ grade, value, bonus: 0, testBonus: 0 });

const base = (over: Partial<ProbabilityConfig> = {}): ProbabilityConfig => ({
  offense: makeOffense("o", 2, 6, 4),
  defense: makeDefense("d"),
  category: "zwyczajne",
  targetHp: 40,
  samples: 3000,
  ...over,
});

describe("explore()", () => {
  it("is deterministic for the same config", () => {
    expect(explore(base())).toEqual(explore(base()));
  });

  it("reduction lowers expected dealt damage", () => {
    const soft = explore(base({ defense: makeDefense("soft") }));
    const armored = explore(base({ defense: makeDefense("armored", { block: 4, protection: 3 }) }));
    expect(armored.expectedDealt).toBeLessThan(soft.expectedDealt);
  });

  it("melee has no hit chance; ranged does", () => {
    expect(explore(base()).hitChance).toBeNull();
    const ranged = explore(base({ ranged: { precision: stat(20), reflex: stat(2), distanceST: 5 } }));
    expect(ranged.hitChance).not.toBeNull();
    expect(ranged.hitChance!).toBeGreaterThan(0);
  });

  it("a high reflex lowers the ranged hit chance", () => {
    const easy = explore(base({ ranged: { precision: stat(10), reflex: stat(2), distanceST: 5 } }));
    const hard = explore(base({ ranged: { precision: stat(10), reflex: stat(80), distanceST: 5 } }));
    expect(hard.hitChance!).toBeLessThan(easy.hitChance!);
  });

  it("computes hits-to-kill from expected dealt", () => {
    const result = explore(base({ targetHp: 100 }));
    expect(result.ttk).toBe(Math.ceil(100 / result.expectedDealt));
  });

  it("returns null ttk when nothing gets through", () => {
    const result = explore(base({ defense: makeDefense("wall", { resistance: 1000 }) }));
    expect(result.expectedDealt).toBe(0);
    expect(result.ttk).toBeNull();
  });

  it("produces a damage distribution summing to the sample count", () => {
    const result = explore(base({ samples: 2000 }));
    expect(result.distribution.reduce((s, b) => s + b.count, 0)).toBe(2000);
  });
});
