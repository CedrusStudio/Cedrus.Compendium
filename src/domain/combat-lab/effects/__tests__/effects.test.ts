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
