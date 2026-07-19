import { describe, it, expect } from "vitest";
import { createRng } from "@/domain/combat-lab/rng/Rng";
import { rollOffense } from "@/domain/combat-lab/engine/rollOffense";
import { reduceDamage, dealDamage, healDamage, defaultDamageResolution } from "@/domain/combat-lab/engine/damage";
import { resolveAttack } from "@/domain/combat-lab/engine/resolveAttack";
import { applyEffects } from "@/domain/combat-lab/engine/applyEffect";
import { createRuntime } from "@/domain/combat-lab/engine/CombatState";
import { CombatLogBuilder } from "@/domain/combat-lab/engine/CombatLog";
import { runCombat } from "@/domain/combat-lab/engine/runCombat";
import { greedyDamagePolicy, basicAttackPolicy } from "@/domain/combat-lab/engine/ai/policy";
import type { Effect } from "@/domain/combat-lab/effects/Effect";
import { makeSnapshot, makeOffense, makeDefense } from "@/domain/combat-lab/engine/__tests__/engineFixtures";

describe("rollOffense()", () => {
  it("is deterministic for a given seed", () => {
    const offense = makeOffense("o", 2, 5, 3);
    const a = rollOffense(offense, createRng(1).next);
    const b = rollOffense(offense, createRng(1).next);
    expect(a).toEqual(b);
  });

  it("sums weapon dice and flat bonus into total", () => {
    const offense = makeOffense("o", 2, 5, 3);
    const result = rollOffense(offense, createRng(42).next);
    // 2 dice of k10 (1..10 each) + 2*2 bonus applied per die inside handleWeaponDamageRolls.
    expect(result.total).toBeGreaterThan(0);
    expect(result.leading).toBe(result.total);
  });
});

describe("damage reduction and pools", () => {
  it("subtracts flat reduction then resistance", () => {
    const defense = makeDefense("d", { block: 3, protection: 2, resistance: 1 });
    // full reduction = block+parry+dodge+bonus+protection = 3+0+0+0+2 = 5, then -1 resistance
    expect(reduceDamage(20, defense, defaultDamageResolution)).toBe(14);
  });

  it("applies immunity as a percentage multiplier", () => {
    const defense = makeDefense("d", { immunity: 50 });
    expect(reduceDamage(20, defense, defaultDamageResolution)).toBe(10);
  });

  it("full immunity blocks everything", () => {
    const defense = makeDefense("d", { immunity: 100 });
    expect(reduceDamage(20, defense, defaultDamageResolution)).toBe(0);
  });

  it("true damage ignores defense", () => {
    const defense = makeDefense("d", { block: 100, immunity: 100 });
    expect(reduceDamage(20, defense, defaultDamageResolution, true)).toBe(20);
  });

  it("consumes barrier before hp", () => {
    const runtime = createRuntime(makeSnapshot("x", { maxHp: 30, barrier: 10 }));
    const hp = dealDamage(runtime, 15);
    expect(runtime.barrier).toBe(0);
    expect(hp).toBe(25);
  });

  it("does not heal above max", () => {
    const runtime = createRuntime(makeSnapshot("x", { maxHp: 30 }));
    runtime.currentHp = 25;
    expect(healDamage(runtime, 100)).toBe(30);
  });
});

describe("resolveAttack()", () => {
  it("returns a non-negative dealt amount reduced by defense", () => {
    const attacker = makeSnapshot("a", { offense: makeOffense("a-off", 3, 6, 5) });
    const defender = makeSnapshot("b", { defense: makeDefense("b-def", { block: 4, protection: 2 }) });
    const result = resolveAttack(attacker, defender, createRng(7).next);
    expect(result.dealt).toBeGreaterThanOrEqual(0);
    expect(result.dealt).toBeLessThanOrEqual(result.raw);
    expect(result.reduced).toBe(result.raw - result.dealt);
  });
});

describe("applyEffects()", () => {
  it("applies a damage effect to the target", () => {
    const source = createRuntime(makeSnapshot("s"));
    const target = createRuntime(makeSnapshot("t", { maxHp: 50 }));
    const effects: Effect[] = [
      { type: "damage", damage: { amount: 0, grade: 0, bonus: 10 }, damageType: "true" },
    ];
    const log = new CombatLogBuilder(1);
    applyEffects(effects, source, target, { random: createRng(1).next, log });
    expect(target.currentHp).toBe(40);
  });

  it("chance effect fires deterministically per seed", () => {
    const source = createRuntime(makeSnapshot("s"));
    const target = createRuntime(makeSnapshot("t"));
    const effects: Effect[] = [
      { type: "chance", chance: 100, then: [{ type: "status", status: "stagger", duration: 2 }] },
    ];
    const log = new CombatLogBuilder(1);
    applyEffects(effects, source, target, { random: createRng(1).next, log });
    expect(target.statuses.map(s => s.status)).toContain("stagger");
  });

  it("heals the source, not the target", () => {
    const source = createRuntime(makeSnapshot("s", { maxHp: 50 }));
    source.currentHp = 10;
    const target = createRuntime(makeSnapshot("t"));
    const effects: Effect[] = [{ type: "heal", amount: { amount: 0, grade: 0, bonus: 15 } }];
    const log = new CombatLogBuilder(1);
    applyEffects(effects, source, target, { random: createRng(1).next, log });
    expect(source.currentHp).toBe(25);
  });
});

describe("runCombat()", () => {
  it("produces an identical log for the same inputs (determinism)", () => {
    const a = makeSnapshot("knight", { offense: makeOffense("k", 2, 6, 4), maxHp: 45, initiativeValue: 3 });
    const b = makeSnapshot("orc", { offense: makeOffense("o", 2, 5, 3), maxHp: 40, initiativeValue: 1 });

    const log1 = runCombat(a, b, { seed: 2026, policyA: greedyDamagePolicy, policyB: basicAttackPolicy });
    const log2 = runCombat(a, b, { seed: 2026, policyA: greedyDamagePolicy, policyB: basicAttackPolicy });

    expect(log1).toEqual(log2);
  });

  it("different seeds can produce different fights", () => {
    const a = makeSnapshot("a", { maxHp: 30 });
    const b = makeSnapshot("b", { maxHp: 30 });
    const log1 = runCombat(a, b, { seed: 1 });
    const log2 = runCombat(a, b, { seed: 999 });
    expect(log1.events).not.toEqual(log2.events);
  });

  it("terminates with a winner when one side out-damages the other", () => {
    const strong = makeSnapshot("strong", { offense: makeOffense("s", 4, 8, 10), maxHp: 60, initiativeValue: 5 });
    const weak = makeSnapshot("weak", { offense: makeOffense("w", 1, 2, 0), maxHp: 20 });

    const log = runCombat(strong, weak, { seed: 3, maxRounds: 100 });
    const end = log.events.find(e => e.kind === "combatEnd");
    expect(end).toBeDefined();
    if (end && end.kind === "combatEnd") {
      expect(end.reason).toBe("knockout");
      expect(end.winnerId).toBe("strong");
    }
  });

  it("respects the round cap and ends as timeout when nobody can kill", () => {
    // Both deal 0 damage (immune), so the fight must hit the cap.
    const a = makeSnapshot("a", { defense: makeDefense("ad", { immunity: 100 }), maxHp: 30 });
    const b = makeSnapshot("b", { defense: makeDefense("bd", { immunity: 100 }), maxHp: 30 });

    const log = runCombat(a, b, { seed: 1, maxRounds: 10 });
    const end = log.events.find(e => e.kind === "combatEnd");
    if (end && end.kind === "combatEnd") {
      expect(end.reason).toBe("timeout");
      expect(end.rounds).toBe(10);
    }
  });

  it("bleeding status ticks damage over rounds", () => {
    const bleedManeuver = {
      id: "m-bleed",
      name: "Rozcięcie",
      grade: 1,
      description: "",
      requirements: [],
      price: 1,
      tags: [],
      castTime: "Standardowa" as const,
      cooldown: 0,
      cost: { castTime: "Standardowa" as const },
      hardRequirements: [],
      effects: [
        {
          type: "status" as const,
          status: "bleeding" as const,
          duration: 3,
          tick: { damage: { amount: 0, grade: 0, bonus: 5 }, damageType: "physical" as const },
        },
      ],
    };
    const bleeder = makeSnapshot("bleeder", { maneuvers: [bleedManeuver], initiativeValue: 5, offense: makeOffense("bo", 1, 2, 0) });
    const victim = makeSnapshot("victim", { maxHp: 100, offense: makeOffense("vo", 1, 2, 0) });

    const log = runCombat(bleeder, victim, { seed: 5, policyA: greedyDamagePolicy, maxRounds: 20 });
    const ticks = log.events.filter(e => e.kind === "statusTick");
    expect(ticks.length).toBeGreaterThan(0);
  });
});
