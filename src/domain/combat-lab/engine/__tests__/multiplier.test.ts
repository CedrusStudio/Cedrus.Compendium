import { describe, it, expect } from "vitest";
import { applyDamageMultipliers } from "@/domain/combat-lab/engine/damage";
import { applyEffects } from "@/domain/combat-lab/engine/applyEffect";
import { createRuntime } from "@/domain/combat-lab/engine/CombatState";
import { CombatLogBuilder } from "@/domain/combat-lab/engine/CombatLog";
import { createRng } from "@/domain/combat-lab/rng/Rng";
import { makeSnapshot } from "@/domain/combat-lab/engine/__tests__/engineFixtures";
import type { MultiplierEffect } from "@/domain/combat-lab/effects/Effect";

const ctx = () => ({ random: createRng(1).next, log: new CombatLogBuilder(1) });

describe("damage multipliers (procent / mnożnik)", () =>
{
  it("compounds sequentially with per-multiplier rounding", () =>
  {
    expect(applyDamageMultipliers(5, [{ factor: 2, rounding: "up" }])).toBe(10);
    expect(applyDamageMultipliers(7, [{ factor: 0.9, rounding: "up" }])).toBe(7); // ceil(6.3)
    expect(applyDamageMultipliers(7, [{ factor: 0.9, rounding: "down" }])).toBe(6); // floor(6.3)
    // ×2 then ×0.5 compounds back to the original.
    expect(applyDamageMultipliers(8, [{ factor: 2, rounding: "up" }, { factor: 0.5, rounding: "up" }])).toBe(8);
    expect(applyDamageMultipliers(3, [{ factor: 0, rounding: "up" }])).toBe(0);
  });

  it("a multiplier effect registers on the recipient runtime", () =>
  {
    const source = createRuntime(makeSnapshot("A"));
    const target = createRuntime(makeSnapshot("B"));
    const eff: MultiplierEffect = { type: "multiplier", mode: "self", target: "damageDealt", factor: 2, duration: 3 };
    applyEffects([eff], source, target, ctx());

    expect(source.activeMultipliers).toHaveLength(1);
    expect(source.activeMultipliers[0]!.factor).toBe(2);
    expect(source.activeMultipliers[0]!.target).toBe("damageDealt");
    expect(target.activeMultipliers).toHaveLength(0);
  });

  it("mode target attaches the multiplier to the opponent (debuff)", () =>
  {
    const source = createRuntime(makeSnapshot("A"));
    const target = createRuntime(makeSnapshot("B"));
    const eff: MultiplierEffect = { type: "multiplier", mode: "target", target: "damageTaken", factor: 1.5, duration: 2 };
    applyEffects([eff], source, target, ctx());

    expect(target.activeMultipliers).toHaveLength(1);
    expect(target.activeMultipliers[0]!.rounding).toBe("up"); // default
  });
});
