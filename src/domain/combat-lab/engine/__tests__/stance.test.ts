import { describe, it, expect } from "vitest";
import { createRuntime } from "@/domain/combat-lab/engine/CombatState";
import { applyEffects } from "@/domain/combat-lab/engine/applyEffect";
import { CombatLogBuilder } from "@/domain/combat-lab/engine/CombatLog";
import { createRng } from "@/domain/combat-lab/rng/Rng";
import { runCombat } from "@/domain/combat-lab/engine/runCombat";
import { basicAttackPolicy } from "@/domain/combat-lab/engine/ai/policy";
import { makeSnapshot } from "@/domain/combat-lab/engine/__tests__/engineFixtures";
import type { Effect } from "@/domain/combat-lab/effects/Effect";
import type { CombatantSnapshot } from "@/domain/combat-lab/engine/CombatantSnapshot";

const ctx = () => ({ random: createRng(1).next, log: new CombatLogBuilder(1) });
const prot = (n: number): Effect[] => [{ type: "stat", mode: "self", duration: 1, protection: n }];

function withStance(snap: CombatantSnapshot, variantsByGrade: Record<number, Effect[]>, baseGrade = 1): CombatantSnapshot
{
  return { ...snap, stance: { name: "Postawa", baseGrade, variantsByGrade } };
}

describe("stances / states", () =>
{
  it("seeds the active stance and its rank ladder from the snapshot", () =>
  {
    const rt = createRuntime(withStance(makeSnapshot("A"), { 1: prot(2), 2: prot(5) }));
    expect(rt.activeStance?.grades).toEqual([1, 2]);
    expect(rt.activeStance?.mode.baseGrade).toBe(1);
    expect(rt.activeState).toBeUndefined();
  });

  it("stanceRank effect bumps the active rank for a duration", () =>
  {
    const source = createRuntime(withStance(makeSnapshot("A"), { 1: prot(2), 2: prot(5) }));
    const target = createRuntime(makeSnapshot("B"));
    applyEffects([{ type: "stanceRank", delta: 1, duration: 3 }], source, target, ctx());
    expect(source.activeStance?.rankBonus).toBe(1);
    expect(source.activeStance?.rankBonusRemaining).toBe(3);
  });

  it("auto-casts the stance's effects each turn (buff events appear for the wearer)", () =>
  {
    const a = withStance(makeSnapshot("A", { maxHp: 50 }), { 1: prot(3) });
    const b = makeSnapshot("B", { maxHp: 50 });
    const log = runCombat(a, b, { seed: 3, policyA: basicAttackPolicy, policyB: basicAttackPolicy, maxRounds: 4 });

    const stanceBuffs = log.events.filter(e => e.kind === "buff" && e.targetId === "A");
    expect(stanceBuffs.length).toBeGreaterThan(0);
  });

  it("a defensive stance reduces damage taken over a fight", () =>
  {
    const attacker = makeSnapshot("att", { maxHp: 60 });
    const bare = makeSnapshot("def", { maxHp: 60 });
    const armored = withStance(makeSnapshot("def", { maxHp: 60 }), { 1: prot(6) });

    const hpAfter = (defender: CombatantSnapshot) =>
    {
      const log = runCombat(attacker, defender, { seed: 11, policyA: basicAttackPolicy, policyB: basicAttackPolicy, maxRounds: 6 });
      const last = [...log.events].reverse().find(e => (e.kind === "attack") && e.targetId === "def");
      return last && last.kind === "attack" ? last.remainingHp : 60;
    };

    expect(hpAfter(armored)).toBeGreaterThan(hpAfter(bare));
  });
});
