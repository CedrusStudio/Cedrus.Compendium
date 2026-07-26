import { describe, it, expect } from "vitest";
import { flattenEffects, isEffectOfType, type Effect } from "@/domain/combat-lab/effects/Effect";
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
