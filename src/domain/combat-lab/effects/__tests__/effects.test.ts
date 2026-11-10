import { describe, it, expect } from "vitest";
import { flattenEffects, isEffectOfType, type Effect, type EffectCondition, type ScaleSource } from "@/domain/combat-lab/effects/Effect";
import { effectSchema, maneuverDefinitionExtrasSchema } from "@/domain/combat-lab/effects/effectSchema";
import { describeManeuver } from "@/domain/combat-lab/effects/describeManeuver";
import { toManeuverDefinition } from "@/domain/combat-lab/effects/ManeuverDefinition";
import { shieldBash } from "@/domain/combat-lab/effects/__tests__/fixtures";
import { CreateDefaultManeuver } from "@/domain/characters/combat/Maneuver";

describe("Effect model", () => {
  describe("flattenEffects()", () => {
    it("flattens nested chance branches", () => {
      const flat = flattenEffects(shieldBash.effects);
      const types = flat.map((e) => e.type);
      // damage, push, chance, and the status inside the chance branch
      expect(types).toEqual(["damage", "push", "chance", "status"]);
    });

    it("returns a flat list unchanged", () => {
      const effects: Effect[] = [
        { type: "heal", amount: { amount: 1, grade: 3, bonus: 0 } },
        { type: "push", distance: 1 },
      ];
      expect(flattenEffects(effects)).toHaveLength(2);
    });
  });

  describe("isEffectOfType()", () => {
    it("narrows the union", () => {
      const effect: Effect = { type: "push", distance: 3 };
      if (isEffectOfType(effect, "push")) {
        expect(effect.distance).toBe(3);
      } else {
        throw new Error("expected push effect");
      }
    });
  });

  describe("effectSchema (Zod)", () => {
    it("accepts every effect in the Shield Bash fixture", () => {
      for (const effect of shieldBash.effects) {
        expect(effectSchema.safeParse(effect).success).toBe(true);
      }
    });

    it("validates recursive chance effects", () => {
      const nested: Effect = {
        type: "chance",
        chance: 50,
        then: [{ type: "chance", chance: 20, then: [{ type: "push", distance: 1 }] }],
      };
      expect(effectSchema.safeParse(nested).success).toBe(true);
    });

    it("rejects a chance outside [0, 100]", () => {
      const bad = { type: "chance", chance: 150, then: [] };
      expect(effectSchema.safeParse(bad).success).toBe(false);
    });

    it("rejects an unknown effect type", () => {
      expect(effectSchema.safeParse({ type: "teleport" }).success).toBe(false);
    });

    it("accepts every kind of action ban and rejects an invented one", () => {
      for (const action of ["attack", "maneuvers", "stanceChange", "spells"])
      {
        expect(effectSchema.safeParse({ type: "forbidAction", action, duration: 0 }).success).toBe(true);
      }
      // Literówka w akcji musi paść przy wczytaniu, a nie zamienić się w zakaz,
      // którego silnik nigdy nie sprawdzi.
      expect(effectSchema.safeParse({ type: "forbidAction", action: "attacks", duration: 0 }).success).toBe(false);
      expect(effectSchema.safeParse({ type: "forbidAction", action: "attack", duration: -1 }).success).toBe(false);
    });

    it("validates the full maneuver extras", () => {
      const parsed = maneuverDefinitionExtrasSchema.safeParse({
        effects: shieldBash.effects,
        hardRequirements: shieldBash.hardRequirements,
        cost: shieldBash.cost,
      });
      expect(parsed.success).toBe(true);
    });
  });

  describe("describeManeuver()", () => {
    it("generates a readable Polish description for Shield Bash", () => {
      const text = describeManeuver(shieldBash);
      expect(text).toBe(
        "Shield Bash (Standardowa, odnowienie 1). Wymaga: tarcza. " +
          "Zadaje 5 obrażeń zwyczajnych; odpycha o 2; 35% szansy: nakłada Oszołomienie na 1 rundę.",
      );
    });

    it("omits requirements and effects sections when empty", () => {
      const empty = toManeuverDefinition({ ...CreateDefaultManeuver(), name: "Cios", cooldown: 0 });
      const text = describeManeuver(empty);
      expect(text).toBe("Cios (Standardowa).");
    });

    it("nazywa zakaz akcji po polsku", () => {
      const maneuver = toManeuverDefinition({ ...CreateDefaultManeuver(), name: "Pełna Defensywna", cooldown: 0 });
      maneuver.effects = [{ type: "forbidAction", action: "attack", duration: 0 }];
      expect(describeManeuver(maneuver)).toBe("Pełna Defensywna (Standardowa). Uniemożliwia atakowanie.");

      maneuver.effects = [{ type: "forbidAction", action: "stanceChange", duration: 2 }];
      expect(describeManeuver(maneuver)).toBe("Pełna Defensywna (Standardowa). Uniemożliwia zmianę postawy na 2 rundy.");
    });

    it("renders dice-based damage with kX notation", () => {
      const maneuver = toManeuverDefinition({ ...CreateDefaultManeuver(), name: "Pchnięcie", cooldown: 0 });
      maneuver.effects = [
        { type: "damage", damage: { amount: 2, grade: 5, bonus: 3 }, damageType: "blokowane" },
      ];
      expect(describeManeuver(maneuver)).toBe(
        "Pchnięcie (Standardowa). Zadaje 2k10+3 obrażeń blokowanych.",
      );
    });
  });

  describe("descriptions of nested combat rules", () => {
    const describeEffectText = (effect: Effect) => describeManeuver(toManeuverDefinition({
      ...CreateDefaultManeuver(), name: "Manewr", cooldown: 0, effects: [effect],
    }));

    const conditions: [EffectCondition, string][] = [
      [{ kind: "opponentAttackKind", value: "rangedMagic" }, "Tylko przeciw magii dystansowej"],
      [{ kind: "targetHasStatus", status: "bleeding" }, "Gdy cel ma Krwawienie"],
      [{ kind: "selfHasStatus", status: "bleeding" }, "Gdy masz Krwawienie"],
      [{ kind: "onCritical" }, "Przy trafieniu krytycznym"],
      [{ kind: "onDamageDealt" }, "Gdy zadano obrażenia"],
      [{ kind: "selfAirborne" }, "Atakując z powietrza"],
      [{ kind: "opponentCharging" }, "Tylko przeciw szarży"],
      [{ kind: "hasResource", resource: "essence", min: 3 }, "Gdy masz ≥3 esencji"],
    ];

    it.each(conditions)("keeps the trigger visible in the description: %j", (condition, label) => {
      const text = describeEffectText({ type: "when", condition, then: [{ type: "push", distance: 2 }] });
      expect(text).toBe(`Manewr (Standardowa). ${label}: odpycha o 2.`);
    });

    const sources: [ScaleSource, string][] = [
      [{ kind: "selfDice" }, "kość broni"],
      [{ kind: "opponentDice" }, "kość przeciwnika"],
      [{ kind: "opponentImmunity" }, "niewrażliwość wroga"],
      [{ kind: "selfResource", resource: "essence" }, "esencję"],
      [{ kind: "selfStatusStacks", status: "bleeding" }, "stack: Krwawienie"],
      [{ kind: "targetStatusStacks", status: "bleeding" }, "stack celu: Krwawienie"],
      [{ kind: "selfStat", group: "characteristics", key: "strength" }, "siła (twoja)"],
      [{ kind: "opponentStat", group: "attributes", key: "reflex" }, "refleks przeciwnika"],
    ];

    it.each(sources)("identifies the scale source and its cap: %j", (source, label) => {
      const text = describeEffectText({
        type: "scale", source, per: 2, cap: 3,
        effect: { type: "heal", amount: { amount: 1, grade: 3, bonus: -1, isPhantom: true } },
      });
      expect(text).toBe(`Manewr (Standardowa). Za każde 2 ${label}: leczy 1k6w-1 punktów zdrowia (maks. 3×).`);
    });

    it("distinguishes the attacker and defender pools, reward target and margin cap", () => {
      const text = describeEffectText({
        type: "contested",
        attacker: { pool: [{ anyOf: [{ group: "attributes", key: "fencing" }, { group: "attributes", key: "precision" }] }], modifier: 2, dieGradeDelta: 1, rollMod: "advantage" },
        defender: { pool: [{ anyOf: [{ group: "attributes", key: "reflex" }] }], modifier: -1, dieGradeDelta: -1, rollMod: "disadvantage" },
        onWin: [{ type: "pull", distance: 2 }],
        onWinTarget: "self",
        perMargin: { per: 2, cap: 3, effect: { type: "resource", resource: "essence", delta: 1 } },
      });

      expect(text).toBe("Manewr (Standardowa). Test sporny fechtunek/precyzja+2 [przewaga, kość +1] vs refleks-1 [utrudnienie, kość -1] → przy wygranej (na siebie): przyciąga o 2; za każde 2 oczek przewagi: przywraca 1 esencji (maks. 3×).");
    });

    it("shows who rolls a save and distinguishes flat failure from scaled damage", () => {
      const text = describeEffectText({
        type: "save",
        pool: { pool: [{ anyOf: [{ group: "attributes", key: "fortitude" }] }] },
        who: "self",
        st: 7,
        onFail: [{ type: "resource", resource: "essence", delta: -2 }],
        perMarginOfFailure: { per: 1, effect: { type: "damage", damage: { amount: 0, grade: 0, bonus: 1 }, damageType: "zwyczajne" } },
      });

      expect(text).toBe("Manewr (Standardowa). Test wytrwałość (atakujący) o ST 7 → przy porażce: odbiera 2 esencji; za każde oczko porażki: zadaje 1 obrażeń zwyczajnych.");
    });
  });

  describe("toManeuverDefinition()", () => {
    it("lifts a plain maneuver with empty effects and derived cost", () => {
      const maneuver = CreateDefaultManeuver();
      const definition = toManeuverDefinition(maneuver);
      expect(definition.effects).toEqual([]);
      expect(definition.hardRequirements).toEqual([]);
      expect(definition.cost.castTime).toBe(maneuver.castTime);
    });
  });
});

describe("describes authored maneuver modifiers and limits", () => {
  const effects: [Effect, string][] = [
    [{ type: "status", status: "poisoned", duration: 2, stacks: 3 }, " (x3) na 2 rundy"],
    [{ type: "buff", profile: { profileId: "osłona" }, duration: 2 }, "Wzmacnia na 2 rundy"],
    [{ type: "debuff", profile: { profileId: "osłona" }, duration: 2 }, "Osłabia na 2 rundy"],
    [{ type: "multiplier", mode: "self", target: "damageDealt", factor: 2, duration: 1 }, "Mnoży sobie zadawane obrażenia ×2"],
    [{ type: "multiplier", mode: "target", target: "damageTaken", factor: 0.5, duration: 2 }, "Mnoży celowi otrzymywane obrażenia ×0.5"],
    [{ type: "stanceRank", target: "state", delta: 2, duration: 1 }, "Podnosi rangę stanu o 2"],
    [{ type: "stanceRank", delta: 1, duration: 2 }, "Podnosi rangę postawy o 1"],
    [{ type: "forbidTag", scope: "maneuvers", tag: "defensywne", duration: 2 }, 'Uniemożliwia używanie manewrów z tagiem „defensywne" na 2 rundy'],
    [{ type: "forbidTag", scope: "stances", tag: "defensywne", duration: 0 }, 'Uniemożliwia używanie postaw z tagiem „defensywne".'],
    [{ type: "forbidTag", tag: "defensywne", duration: 0 }, "Uniemożliwia używanie postaw i manewrów"],
    [{ type: "forbidAction", action: "maneuvers", duration: 1 }, "Uniemożliwia używanie manewrów"],
    [{ type: "forbidAction", action: "spells", duration: 1 }, "Uniemożliwia rzucanie zaklęć"],
    [{ type: "roll", modifier: "advantage" }, "Przewaga na rzut ataku (2 rzuty, wyższy)"],
    [{ type: "roll", modifier: "disadvantage" }, "Utrudnienie rzutu ataku (2 rzuty, niższy)"],
    [{ type: "roll", modifier: "extraDie" }, "Dodatkowa kość obrażeń k6"],
    [{ type: "roll", modifier: "extraDie", grade: 5 }, "Dodatkowa kość obrażeń k10"],
    [{ type: "pull", distance: 2 }, "Przyciąga o 2"],
    [{ type: "damage", damageType: "bezpośrednie", damage: { amount: 2, grade: 3, isPhantom: true, bonus: -2 } }, "Zadaje 2k6w-2 obrażeń"],
    [{ type: "damage", damageType: "zwyczajne", damage: { amount: 1, grade: 3, bonus: 0 } }, "Zadaje 1k6 obrażeń"],
    [{ type: "custom", effectType: "unsupported-demo", data: {} }, 'Efekt „unsupported-demo"'],
  ];

  it.each(effects)("shows the effect's mechanics: %j", (effect, clause) => {
    const entry = { ...CreateDefaultManeuver(), name: "Próba lodu", cooldown: 0, effects: [effect] };
    expect(describeManeuver(toManeuverDefinition(entry))).toContain(clause);
  });

  it("lists resource cost and requirements separately from the effects", () => {
    const entry = toManeuverDefinition({ ...CreateDefaultManeuver(), name: "Próba lodu", cooldown: 3 });
    const text = describeManeuver({
      ...entry, cost: { castTime: "Standardowa", essence: 2 },
      hardRequirements: [
        { kind: "weapon", value: "melee" }, { kind: "shield" },
        { kind: "statusOnTarget", value: "marked" }, { kind: "statusOnSelf", value: "stagger" },
        { kind: "minStat", stat: "strength", value: 3 },
      ],
    });
    expect(text).toBe("Próba lodu (Standardowa, odnowienie 3, 2 esencji). Wymaga: broń: melee, tarcza, cel pod efektem: marked, efekt na sobie: stagger, strength min. 3.");
  });
});
