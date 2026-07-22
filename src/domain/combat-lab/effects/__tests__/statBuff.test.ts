import { describe, it, expect } from "vitest";
import { statEffectToProfile, statEffectDeltas } from "@/domain/combat-lab/effects/statBuff";
import { describeManeuver } from "@/domain/combat-lab/effects/describeManeuver";
import { effectSchema } from "@/domain/combat-lab/effects/effectSchema";
import { effectiveDefense, effectiveOffense } from "@/domain/combat-lab/engine/buffs";
import type { StatBuffEffect, Effect } from "@/domain/combat-lab/effects/Effect";
import type { ManeuverDefinition } from "@/domain/combat-lab/effects/ManeuverDefinition";
import { makeDefense, makeOffense } from "@/domain/combat-lab/engine/__tests__/engineFixtures";

const stat = (over: Partial<StatBuffEffect> = {}): StatBuffEffect => ({ type: "stat", mode: "self", duration: 1, ...over });

const maneuver = (effects: Effect[]): ManeuverDefinition => ({
  id: "m", name: "Manewr", grade: 1, description: "", requirements: [], price: 1, tags: [],
  castTime: "Standardowa", cooldown: 1, cost: { castTime: "Standardowa" }, hardRequirements: [], effects,
});

describe("statEffectToProfile()", () => {
  it("maps flat deltas onto the right BuffProfile fields", () => {
    const p = statEffectToProfile(stat({ block: 2, resistance: 1, damage: 3, diceGrade: 1, precision: 2, barrier: 5 }));
    expect(p.defense.block).toBe(2);
    expect(p.defense.resistance).toBe(1);
    expect(p.offense.damageBonus.bonus).toBe(3);
    expect(p.offense.leadingWeapon.grade).toBe(1);
    expect(p.attributes.precision.value).toBe(2);
    expect(p.health.barrier).toBe(5);
  });

  it("gives the SAME id for identical deltas (so re-application refreshes, not stacks)", () => {
    const a = statEffectToProfile(stat({ block: 2 }));
    const b = statEffectToProfile(stat({ block: 2 }));
    const c = statEffectToProfile(stat({ block: 3 }));
    expect(a.id).toBe(b.id);
    expect(a.id).not.toBe(c.id);
  });

  it("a self stat buff raises the effective defence layer it targets", () => {
    const base = makeDefense("d", { block: 1 });
    const buffed = effectiveDefense(base, [statEffectToProfile(stat({ block: 2 }))]);
    expect(buffed.block).toBe(3);
  });

  it("an offence stat buff raises the effective damage bonus", () => {
    const base = makeOffense("o", 1, 5, 0);
    const buffed = effectiveOffense(base, [statEffectToProfile(stat({ damage: 4 }))]);
    expect(buffed.damageBonus.bonus).toBe(4);
  });
});

describe("statEffectDeltas()", () => {
  it("returns only non-zero deltas with Polish labels", () => {
    expect(statEffectDeltas(stat({ block: 2, dodge: 0, resistance: -1 }))).toEqual([["blok", 2], ["odporność", -1]]);
  });
});

describe("stat effect — schema & description", () => {
  it("validates against effectSchema", () => {
    expect(effectSchema.safeParse(stat({ block: 2, mode: "self", duration: 2 })).success).toBe(true);
    expect(effectSchema.safeParse({ type: "stat" }).success).toBe(false); // missing mode/duration
  });

  it("describes a self buff with signed deltas and duration", () => {
    const text = describeManeuver(maneuver([stat({ block: 2, dodge: 1, duration: 2 })]));
    expect(text).toContain("blok +2");
    expect(text).toContain("unik +1");
    expect(text).toContain("sobie");
  });

  it("describes a target debuff", () => {
    const text = describeManeuver(maneuver([stat({ mode: "target", resistance: -2, duration: 1 })]));
    expect(text).toContain("celowi");
    expect(text).toContain("odporność -2");
  });
});
