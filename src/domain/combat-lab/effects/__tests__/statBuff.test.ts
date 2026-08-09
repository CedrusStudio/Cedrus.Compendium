import { describe, it, expect } from "vitest";
import {
  statEffectToProfile,
  statEffectDeltas,
  statBuffLabel,
  STAT_BUFF_ATTRIBUTES,
  STAT_BUFF_CHARACTERISTICS,
} from "@/domain/combat-lab/effects/statBuff";
import { describeManeuver } from "@/domain/combat-lab/effects/describeManeuver";
import { effectSchema } from "@/domain/combat-lab/effects/effectSchema";
import { effectiveDefense, effectiveOffense } from "@/domain/combat-lab/engine/buffs";
import type { StatBuffEffect, Effect } from "@/domain/combat-lab/effects/Effect";
import type { ManeuverDefinition } from "@/domain/combat-lab/effects/ManeuverDefinition";
import { makeDefense, makeOffense } from "@/domain/combat-lab/engine/__tests__/engineFixtures";

const stat = (over: Partial<StatBuffEffect> = {}): StatBuffEffect => ({ type: "stat", mode: "self", duration: 1, ...over });

const maneuver = (effects: Effect[]): ManeuverDefinition => ({
  id: "m", name: "Manewr", grade: 1, description: "", price: 1, tags: [],
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

/**
 * Wave 9.3. The effect used to know three attributes out of nine and no
 * characteristics at all, which is what blocked 16 stance families.
 */
describe("słownik cech testowych (9.3)", () => {
  it("zna wszystkie dziewięć atrybutów i sześć charakterystyk", () => {
    expect(STAT_BUFF_ATTRIBUTES).toHaveLength(9);
    expect(STAT_BUFF_CHARACTERISTICS).toHaveLength(6);
    expect(STAT_BUFF_ATTRIBUTES).toContain("fencing");
    expect(STAT_BUFF_CHARACTERISTICS).toContain("spellborn");
  });

  it("kładzie każdą cechę we właściwym polu profilu, w `.value`", () => {
    const p = statEffectToProfile(stat({ fencing: 2, willpower: -1, strength: 3 }));

    expect(p.attributes.fencing.value).toBe(2);
    expect(p.attributes.willpower.value).toBe(-1);
    expect(p.characteristics.strength.value).toBe(3);
    // Nie `.testBonus` — podręcznikowe „zwiększa fechtunek o 1" podnosi cechę.
    expect(p.attributes.fencing.testBonus).toBe(0);
  });

  it("każda cecha ma własny wpis w deltach — inaczej dwa buffy dostałyby ten sam id", () => {
    // To najłatwiejszy do przeoczenia błąd w tym zadaniu: pole dodane do
    // aplikatora, ale nie do delt, daje kolizję `id` i ciche nadpisywanie.
    for (const key of [...STAT_BUFF_ATTRIBUTES, ...STAT_BUFF_CHARACTERISTICS])
    {
      const deltas = statEffectDeltas(stat({ [key]: 2 }));
      expect(deltas).toEqual([[statBuffLabel(key), 2]]);
    }
  });

  it("dwa różne buffy atrybutowe mają różne id", () => {
    const ids = new Set([...STAT_BUFF_ATTRIBUTES, ...STAT_BUFF_CHARACTERISTICS]
      .map(key => statEffectToProfile(stat({ [key]: 1 })).id));

    expect(ids.size).toBe(STAT_BUFF_ATTRIBUTES.length + STAT_BUFF_CHARACTERISTICS.length);
  });

  it("schema przyjmuje nowe pola", () => {
    for (const key of [...STAT_BUFF_ATTRIBUTES, ...STAT_BUFF_CHARACTERISTICS])
    {
      expect(effectSchema.safeParse({ type: "stat", mode: "self", duration: 1, [key]: 2 }).success).toBe(true);
    }
  });

  it("literówka w nazwie cechy jest USUWANA, nie odrzucana — dlatego import osobno porównuje klucze", () => {
    // Zod strzepuje nieznane klucze i zwraca sukces. Zaostrzenie schematu
    // wywaliłoby wpisy z bazy niosące pola z dawnych refaktorów, więc obroną
    // jest kontrola kluczy w `scripts/import-mode-effects.ts`, nie tutaj.
    const typo = effectSchema.safeParse({ type: "stat", mode: "self", duration: 1, fencingg: 2 });

    expect(typo.success).toBe(true);
    expect(typo.success && "fencingg" in typo.data).toBe(false);
    expect(statEffectDeltas(stat({ fencingg: 2 } as Partial<StatBuffEffect>))).toEqual([]);
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
