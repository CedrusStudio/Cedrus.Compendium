import { describe, it, expect } from "vitest";
import { applyEffects, evaluateCondition } from "@/domain/combat-lab/engine/applyEffect";
import { createRuntime, activeBuffProfiles } from "@/domain/combat-lab/engine/CombatState";
import { CombatLogBuilder } from "@/domain/combat-lab/engine/CombatLog";
import { createRng } from "@/domain/combat-lab/rng/Rng";
import type { StatBuffEffect } from "@/domain/combat-lab/effects/Effect";
import { makeSnapshot, makeOffense } from "@/domain/combat-lab/engine/__tests__/engineFixtures";

const stat = (over: Partial<StatBuffEffect> = {}): StatBuffEffect => ({ type: "stat", mode: "self", duration: 1, ...over });

function ctx() { return { random: createRng(1).next, log: new CombatLogBuilder(1) }; }

describe("applyEffect — stat", () => {
  it("self mode pushes an active buff on the source", () => {
    const source = createRuntime(makeSnapshot("A"));
    const target = createRuntime(makeSnapshot("B"));
    applyEffects([stat({ block: 2 })], source, target, ctx());
    expect(source.activeBuffs).toHaveLength(1);
    expect(target.activeBuffs).toHaveLength(0);
    expect(activeBuffProfiles(source)[0]!.defense.block).toBe(2);
  });

  it("target mode applies to the opponent (debuff)", () => {
    const source = createRuntime(makeSnapshot("A"));
    const target = createRuntime(makeSnapshot("B"));
    applyEffects([stat({ mode: "target", resistance: -1 })], source, target, ctx());
    expect(source.activeBuffs).toHaveLength(0);
    expect(target.activeBuffs).toHaveLength(1);
  });

  it("re-applying the same inline buff refreshes duration instead of stacking", () => {
    const source = createRuntime(makeSnapshot("A"));
    const target = createRuntime(makeSnapshot("B"));
    applyEffects([stat({ block: 2, duration: 1 })], source, target, ctx());
    applyEffects([stat({ block: 2, duration: 3 })], source, target, ctx());
    expect(source.activeBuffs).toHaveLength(1);
    expect(source.activeBuffs[0]!.remaining).toBe(3);
  });
});

describe("when (condition) effect", () => {
  it("fires the nested effect only when the condition holds (opponentAttackKind)", () => {
    const source = createRuntime(makeSnapshot("A"));
    const meleeTarget = createRuntime(makeSnapshot("B", { attackKind: "melee" }));
    const rangedTarget = createRuntime(makeSnapshot("C", { attackKind: "rangedPhysical" }));
    const when = { type: "when" as const, condition: { kind: "opponentAttackKind" as const, value: "melee" as const }, then: [{ type: "damage" as const, damage: { amount: 0, grade: 0, bonus: 4 }, damageType: "zwyczajne" as const }] };

    const hpBeforeMelee = meleeTarget.currentHp;
    applyEffects([when], source, meleeTarget, ctx());
    expect(meleeTarget.currentHp).toBe(hpBeforeMelee - 4);

    const hpBeforeRanged = rangedTarget.currentHp;
    applyEffects([when], source, rangedTarget, ctx());
    expect(rangedTarget.currentHp).toBe(hpBeforeRanged); // condition false → skipped
  });

  it("evaluateCondition reads lastAttack for onCritical / onDamageDealt", () => {
    const source = createRuntime(makeSnapshot("A"));
    const target = createRuntime(makeSnapshot("B"));
    expect(evaluateCondition({ kind: "onCritical" }, source, target)).toBe(false);
    source.lastAttack = { critical: true, dealt: 5 };
    expect(evaluateCondition({ kind: "onCritical" }, source, target)).toBe(true);
    expect(evaluateCondition({ kind: "onDamageDealt" }, source, target)).toBe(true);
  });

  it("evaluateCondition reads positional context (airborne / charging)", () => {
    const airborne = createRuntime({ ...makeSnapshot("A"), positional: { airborne: true } });
    const charging = createRuntime({ ...makeSnapshot("B"), positional: { charging: true } });
    const plain = createRuntime(makeSnapshot("C"));
    expect(evaluateCondition({ kind: "selfAirborne" }, airborne, plain)).toBe(true);
    expect(evaluateCondition({ kind: "selfAirborne" }, plain, plain)).toBe(false);
    expect(evaluateCondition({ kind: "opponentCharging" }, plain, charging)).toBe(true);
    expect(evaluateCondition({ kind: "opponentCharging" }, plain, plain)).toBe(false);
  });
});

describe("resources (mana / essence)", () => {
  it("seeds the runtime pool from the snapshot's startingResources", () => {
    const r = createRuntime({ ...makeSnapshot("A"), startingResources: { essence: 4 } });
    expect(r.resources.essence).toBe(4);
    expect(r.resources.mana).toBe(0);
  });

  it("resource effect grants to self / drains the target, and hasResource reads it", () => {
    const source = createRuntime(makeSnapshot("A"));
    const target = createRuntime(makeSnapshot("B"));
    expect(evaluateCondition({ kind: "hasResource", resource: "essence", min: 3 }, source, target)).toBe(false);

    applyEffects([{ type: "resource", resource: "essence", delta: 5 }], source, target, ctx());
    expect(source.resources.essence).toBe(5);
    expect(evaluateCondition({ kind: "hasResource", resource: "essence", min: 3 }, source, target)).toBe(true);

    applyEffects([{ type: "resource", resource: "essence", delta: -2 }], source, target, ctx());
    expect(target.resources.essence).toBe(0); // drain hits target, clamped at 0
    expect(source.resources.essence).toBe(5);
  });
});

describe("scale effect", () => {
  it("applies the nested effect once per unit of the source (selfResource)", () => {
    const source = createRuntime({ ...makeSnapshot("A"), startingResources: { essence: 4 } });
    const target = createRuntime(makeSnapshot("B"));
    const before = target.currentHp;
    // 4 essence, per 2 → 2 applications of 3 damage = 6.
    applyEffects([{
      type: "scale", source: { kind: "selfResource", resource: "essence" }, per: 2,
      effect: { type: "damage", damage: { amount: 0, grade: 0, bonus: 3 }, damageType: "zwyczajne" },
    }], source, target, ctx());
    expect(target.currentHp).toBe(before - 6);
  });

  it("respects the cap and counts opponent dice", () => {
    const source = createRuntime(makeSnapshot("A"));
    const target = createRuntime(makeSnapshot("B", { offense: makeOffense("o", 5, 4, 0) })); // 5 weapon dice
    const before = target.currentHp;
    applyEffects([{
      type: "scale", source: { kind: "opponentDice" }, cap: 2,
      effect: { type: "damage", damage: { amount: 0, grade: 0, bonus: 1 }, damageType: "zwyczajne" },
    }], source, target, ctx());
    expect(target.currentHp).toBe(before - 2); // 5 dice capped at 2
  });
});
