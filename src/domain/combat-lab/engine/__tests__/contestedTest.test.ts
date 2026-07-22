import { describe, it, expect } from "vitest";
import { resolveContestedTest, resolveSaveTest, expectedSideResult } from "@/domain/combat-lab/engine/resolveContestedTest";
import { applyEffects } from "@/domain/combat-lab/engine/applyEffect";
import { createRuntime } from "@/domain/combat-lab/engine/CombatState";
import { CombatLogBuilder } from "@/domain/combat-lab/engine/CombatLog";
import { createRng } from "@/domain/combat-lab/rng/Rng";
import type { ContestedTestEffect, SaveTestEffect } from "@/domain/combat-lab/effects/Effect";
import type { Statistic } from "@/domain/characters/statistics/Statistic";
import { makeSnapshot, makeAttributes, makeCharacteristics } from "@/domain/combat-lab/engine/__tests__/engineFixtures";

const s = (value: number, grade = 3): Statistic => ({ grade, value, bonus: 0, testBonus: 0 });
const skills = (attributes = {}, characteristics = {}) => ({ attributes: makeAttributes(attributes), characteristics: makeCharacteristics(characteristics) });

const ref = (group: "attributes" | "characteristics", key: string) => ({ group, key });
const contested = (over: Partial<ContestedTestEffect> = {}): ContestedTestEffect => ({
  type: "contested",
  attacker: { pool: [{ anyOf: [ref("attributes", "fencing")] }] },
  defender: { pool: [{ anyOf: [ref("attributes", "reflex")] }] },
  onWin: [{ type: "damage", damage: { amount: 0, grade: 0, bonus: 5 }, damageType: "zwyczajne" }],
  ...over,
});

describe("resolveContestedTest()", () => {
  it("is deterministic for a given seed", () => {
    const a = resolveContestedTest(skills({ fencing: s(10) }), skills({ reflex: s(2) }), contested(), createRng(3).next);
    const b = resolveContestedTest(skills({ fencing: s(10) }), skills({ reflex: s(2) }), contested(), createRng(3).next);
    expect(a).toEqual(b);
  });

  it("high attacker pool wins (margin > 0)", () => {
    const r = resolveContestedTest(skills({ fencing: s(30) }), skills({ reflex: s(0) }), contested(), createRng(1).next);
    expect(r.win).toBe(true);
    expect(r.margin).toBeGreaterThan(0);
  });

  it("tie goes to the defender (margin must be strictly > 0)", () => {
    // Constant rng → both dice roll 1; equal pools → equal totals → margin 0.
    const constRng = () => 0;
    const r = resolveContestedTest(
      skills({ fencing: s(5) }), skills({ reflex: s(5) }),
      contested({ attacker: { pool: [{ anyOf: [ref("attributes", "fencing")] }] }, defender: { pool: [{ anyOf: [ref("attributes", "reflex")] }] } }),
      constRng,
    );
    expect(r.margin).toBe(0);
    expect(r.win).toBe(false);
  });
});

describe("alternatives ('/') pick max(value + grade)", () => {
  it("expectedSideResult uses the stronger alternative", () => {
    const withAlt = expectedSideResult(skills({ fencing: s(2, 1), martialArt: s(10, 3) }), {
      pool: [{ anyOf: [ref("attributes", "fencing"), ref("attributes", "martialArt")] }],
    });
    // martialArt (10 + mean die of grade 3 = 3.5) = 13.5 beats fencing (2 + 1.5)
    expect(withAlt).toBeCloseTo(13.5, 5);
  });
});

describe("applyEffect — contested", () => {
  const ctx = () => ({ random: createRng(1).next, log: new CombatLogBuilder(1) });

  it("applies onWin damage to the target on a win", () => {
    const source = createRuntime(makeSnapshot("A", { attributes: { fencing: s(30) } }));
    const target = createRuntime(makeSnapshot("B", { attributes: { reflex: s(0) } }));
    const before = target.currentHp;
    applyEffects([contested()], source, target, ctx());
    expect(target.currentHp).toBe(before - 5);
  });

  it("does nothing on a loss", () => {
    const source = createRuntime(makeSnapshot("A", { attributes: { fencing: s(0) } }));
    const target = createRuntime(makeSnapshot("B", { attributes: { reflex: s(30) } }));
    const before = target.currentHp;
    applyEffects([contested()], source, target, ctx());
    expect(target.currentHp).toBe(before);
  });

  it("onWinTarget 'self' applies the effect to the caster", () => {
    const source = createRuntime(makeSnapshot("A", { attributes: { fencing: s(30) } }));
    const target = createRuntime(makeSnapshot("B", { attributes: { reflex: s(0) } }));
    applyEffects([contested({ onWinTarget: "self", onWin: [{ type: "stat", mode: "self", duration: 1, dodge: 2 }] })], source, target, ctx());
    expect(source.activeBuffs).toHaveLength(1);
    expect(source.activeBuffs[0]!.profile.defense.dodge).toBe(2);
  });
});

describe("resolveSaveTest() / applyEffect save", () => {
  const save = (over: Partial<SaveTestEffect> = {}): SaveTestEffect => ({
    type: "save",
    pool: { pool: [{ anyOf: [ref("attributes", "fortitude")] }] },
    st: 7,
    onFail: [{ type: "damage", damage: { amount: 0, grade: 0, bonus: 3 }, damageType: "zwyczajne" }],
    ...over,
  });
  const ctx = () => ({ random: createRng(1).next, log: new CombatLogBuilder(1) });

  it("low fortitude fails the save (roll < ST)", () => {
    // Constant rng → die rolls 1; pool 0 → roll 1 < ST 7 → failMargin 6.
    const r = resolveSaveTest(skills({ fortitude: s(0) }), save(), () => 0);
    expect(r.failed).toBe(true);
    expect(r.failMargin).toBe(6);
  });

  it("high fortitude passes the save", () => {
    const r = resolveSaveTest(skills({ fortitude: s(30) }), save(), createRng(1).next);
    expect(r.failed).toBe(false);
    expect(r.failMargin).toBe(0);
  });

  it("applies onFail damage to the target that fails", () => {
    const source = createRuntime(makeSnapshot("A"));
    const target = createRuntime(makeSnapshot("B", { attributes: { fortitude: s(0, 0) } }));
    const before = target.currentHp;
    applyEffects([save()], source, target, ctx());
    expect(target.currentHp).toBe(before - 3);
  });
});
