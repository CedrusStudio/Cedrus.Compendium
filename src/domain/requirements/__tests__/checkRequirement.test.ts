import { describe, expect, it } from "vitest";
import { CreateEmptyCharacter } from "@/domain/characters/Character";
import type { Character } from "@/domain/characters/Character";
import type { Statistic } from "@/domain/characters/statistics/Statistic";
import { CreateDefaultManeuver } from "@/domain/characters/combat/Maneuver";
import { CreateDefaultStance, CreateDefaultState } from "@/domain/characters/combat/Mode";
import { CreateDefaultPerk } from "@/domain/characters/Perk";
import { CreateDefaultTalent } from "@/domain/characters/Talent";
import { CreateDefaultPower, CreateDefaultSpell } from "@/domain/characters/combat/Power";
import type { Requirement } from "@/domain/requirements/Requirement";
import { areRequirementsMet, checkRequirement } from "@/domain/requirements/checkRequirement";

function stat(value: number, bonus = 0, testBonus = 0): Statistic
{
  return { grade: 4, value, bonus, testBonus };
}

function baseCharacter(): Character
{
  const character = CreateEmptyCharacter({ name: "Test", shortName: "T", tags: [], description: "" });
  // Deterministic collections (CreateEmptyCharacter seeds defaults with unstable names).
  character.maneuvers = [];
  character.stances = [];
  character.states = [];
  character.perks = [];
  character.powers = [];
  character.talents = [];
  return character;
}

describe("checkRequirement", () => {
  describe("ranked — characteristics / attributes", () => {
    it("passes when the total test value meets the threshold (5 >= 3)", () => {
      const character = baseCharacter();
      character.characteristics.strength = stat(5);
      const req: Requirement = { kind: "ranked", group: "characteristics", targetKey: "strength", value: 3 };
      expect(checkRequirement(req, character)).toBe(true);
    });

    it("fails when the total test value is below the threshold (2 < 3)", () => {
      const character = baseCharacter();
      character.characteristics.strength = stat(2);
      const req: Requirement = { kind: "ranked", group: "characteristics", targetKey: "strength", value: 3 };
      expect(checkRequirement(req, character)).toBe(false);
    });

    it("uses value + bonus + testBonus, not grade", () => {
      const character = baseCharacter();
      character.characteristics.strength = stat(1, 1, 1); // total = 3
      const meets: Requirement = { kind: "ranked", group: "characteristics", targetKey: "strength", value: 3 };
      const misses: Requirement = { kind: "ranked", group: "characteristics", targetKey: "strength", value: 4 };
      expect(checkRequirement(meets, character)).toBe(true);
      expect(checkRequirement(misses, character)).toBe(false);
    });

    it("reads attributes by key (fencing)", () => {
      const character = baseCharacter();
      character.attributes.fencing = stat(4);
      const req: Requirement = { kind: "ranked", group: "attributes", targetKey: "fencing", value: 4 };
      expect(checkRequirement(req, character)).toBe(true);
    });

    it("returns false (never throws) for an unknown statistic key", () => {
      const character = baseCharacter();
      const req: Requirement = { kind: "ranked", group: "characteristics", targetKey: "nonexistent", value: 1 };
      expect(() => checkRequirement(req, character)).not.toThrow();
      expect(checkRequirement(req, character)).toBe(false);
    });

    it("treats a negative required value as trivially satisfied", () => {
      const character = baseCharacter();
      character.characteristics.strength = stat(0);
      const req: Requirement = { kind: "ranked", group: "characteristics", targetKey: "strength", value: -1 };
      expect(checkRequirement(req, character)).toBe(true);
    });
  });

  describe("ranked — owned entities", () => {
    it("passes when the character owns the maneuver at a sufficient grade", () => {
      const character = baseCharacter();
      character.maneuvers = [{ ...CreateDefaultManeuver(), name: "Cios Tarczą", grade: 2 }];
      const req: Requirement = { kind: "ranked", group: "maneuvers", targetKey: "Cios Tarczą", value: 2 };
      expect(checkRequirement(req, character)).toBe(true);
    });

    it("fails when the owned grade is below the required rank", () => {
      const character = baseCharacter();
      character.maneuvers = [{ ...CreateDefaultManeuver(), name: "Cios Tarczą", grade: 1 }];
      const req: Requirement = { kind: "ranked", group: "maneuvers", targetKey: "Cios Tarczą", value: 2 };
      expect(checkRequirement(req, character)).toBe(false);
    });

    it("uses the highest owned grade when multiple ranks are present", () => {
      const character = baseCharacter();
      character.maneuvers = [
        { ...CreateDefaultManeuver(), name: "Cios Tarczą", grade: 1 },
        { ...CreateDefaultManeuver(), name: "Cios Tarczą", grade: 3 },
      ];
      const req: Requirement = { kind: "ranked", group: "maneuvers", targetKey: "Cios Tarczą", value: 3 };
      expect(checkRequirement(req, character)).toBe(true);
    });

    it("normalizes the target key against the entity name (case + whitespace)", () => {
      const character = baseCharacter();
      character.stances = [{ ...CreateDefaultStance(), name: "Postawa Żółwia", grade: 1 }];
      const req: Requirement = { kind: "ranked", group: "stances", targetKey: "  postawa   żółwia ", value: 1 };
      expect(checkRequirement(req, character)).toBe(true);
    });

    it("checks states independently of stances", () => {
      const character = baseCharacter();
      character.states = [{ ...CreateDefaultState(), name: "Wściekłość", grade: 2 }];
      const req: Requirement = { kind: "ranked", group: "states", targetKey: "Wściekłość", value: 2 };
      expect(checkRequirement(req, character)).toBe(true);
    });

    it("checks perks", () => {
      const character = baseCharacter();
      character.perks = [{ ...CreateDefaultPerk(), name: "Twardziel", grade: 1 }];
      const req: Requirement = { kind: "ranked", group: "perks", targetKey: "Twardziel", value: 1 };
      expect(checkRequirement(req, character)).toBe(true);
    });

    it("finds spells nested under powers", () => {
      const character = baseCharacter();
      const power = CreateDefaultPower();
      power.spells = [{ ...CreateDefaultSpell(), name: "Kula Ognia", grade: 3 }];
      character.powers = [power];
      const req: Requirement = { kind: "ranked", group: "spells", targetKey: "Kula Ognia", value: 2 };
      expect(checkRequirement(req, character)).toBe(true);
    });

    it("returns false when the entity is not owned by the character", () => {
      const character = baseCharacter();
      const req: Requirement = { kind: "ranked", group: "maneuvers", targetKey: "Nieznany Manewr", value: 1 };
      expect(checkRequirement(req, character)).toBe(false);
    });
  });

  describe("rankless", () => {
    it("matches an owned entity name after normalization", () => {
      const character = baseCharacter();
      character.perks = [{ ...CreateDefaultPerk(), name: "Zapał Wojownika", grade: 1 }];
      const req: Requirement = { kind: "rankless", text: "  ZAPAŁ   Wojownika " };
      expect(checkRequirement(req, character)).toBe(true);
    });

    it("returns false for free text that matches no owned entity", () => {
      const character = baseCharacter();
      const req: Requirement = { kind: "rankless", text: "musi umieć pływać" };
      expect(checkRequirement(req, character)).toBe(false);
    });

    it("returns false for empty / whitespace-only text", () => {
      const character = baseCharacter();
      expect(checkRequirement({ kind: "rankless", text: "   " }, character)).toBe(false);
    });
  });

  describe("areRequirementsMet", () => {
    it("returns true for an empty requirement list", () => {
      expect(areRequirementsMet([], baseCharacter())).toBe(true);
    });

    it("returns true only when every requirement is met", () => {
      const character = baseCharacter();
      character.characteristics.strength = stat(5);
      character.maneuvers = [{ ...CreateDefaultManeuver(), name: "Cios", grade: 2 }];
      const reqs: Requirement[] = [
        { kind: "ranked", group: "characteristics", targetKey: "strength", value: 3 },
        { kind: "ranked", group: "maneuvers", targetKey: "Cios", value: 2 },
      ];
      expect(areRequirementsMet(reqs, character)).toBe(true);
    });

    it("returns false when any requirement is unmet", () => {
      const character = baseCharacter();
      character.characteristics.strength = stat(1);
      const reqs: Requirement[] = [
        { kind: "ranked", group: "characteristics", targetKey: "strength", value: 3 },
      ];
      expect(areRequirementsMet(reqs, character)).toBe(false);
    });
  });

  // --- Wave 7 ---------------------------------------------------------------

  describe("ranked — talents (umiejętności)", () => {
    it("compares against the Talent's grade", () => {
      const character = baseCharacter();
      character.talents = [{ ...CreateDefaultTalent(), name: "skradanie", grade: 3 }];

      expect(checkRequirement({ kind: "ranked", group: "talents", targetKey: "skradanie", value: 3 }, character)).toBe(true);
      expect(checkRequirement({ kind: "ranked", group: "talents", targetKey: "skradanie", value: 4 }, character)).toBe(false);
    });

    it("returns false for a talent the character does not have", () => {
      const character = baseCharacter();
      expect(checkRequirement({ kind: "ranked", group: "talents", targetKey: "skradanie", value: 1 }, character)).toBe(false);
    });
  });

  describe("ranked — powers (Moc / Więź)", () => {
    it("compares against Power.level for the matching type", () => {
      const character = baseCharacter();
      character.powers = [{ ...CreateDefaultPower(), type: "moc", level: 2 }];

      expect(checkRequirement({ kind: "ranked", group: "powers", targetKey: "moc", value: 2 }, character)).toBe(true);
      expect(checkRequirement({ kind: "ranked", group: "powers", targetKey: "moc", value: 3 }, character)).toBe(false);
      expect(checkRequirement({ kind: "ranked", group: "powers", targetKey: "wiez", value: 1 }, character)).toBe(false);
    });

    it("takes the highest level among several Powers of the same type", () => {
      const character = baseCharacter();
      character.powers = [
        { ...CreateDefaultPower(), type: "moc", level: 1 },
        { ...CreateDefaultPower(), type: "moc", level: 3 },
      ];
      expect(checkRequirement({ kind: "ranked", group: "powers", targetKey: "moc", value: 3 }, character)).toBe(true);
    });

    it("ignores Power.bonus — a requirement describes development, not the current buffed state", () => {
      const character = baseCharacter();
      character.powers = [{ ...CreateDefaultPower(), type: "moc", level: 1, bonus: 5 }];
      expect(checkRequirement({ kind: "ranked", group: "powers", targetKey: "moc", value: 3 }, character)).toBe(false);
    });
  });

  describe("derived — siła zaklęcia", () => {
    const requirement: Requirement = { kind: "ranked", group: "derived", targetKey: "spellStrength", value: 6 };

    it("uses level + bonus, the formula the app displays", () => {
      const character = baseCharacter();
      character.powers = [{ ...CreateDefaultPower(), type: "moc", level: 4, bonus: 2 }];
      expect(checkRequirement(requirement, character)).toBe(true);
    });

    it("is unmet when level + bonus falls short", () => {
      const character = baseCharacter();
      character.powers = [{ ...CreateDefaultPower(), type: "moc", level: 4, bonus: 1 }];
      expect(checkRequirement(requirement, character)).toBe(false);
    });

    it("takes the strongest Power, regardless of type", () => {
      const character = baseCharacter();
      character.powers = [
        { ...CreateDefaultPower(), type: "moc", level: 1, bonus: 0 },
        { ...CreateDefaultPower(), type: "wiez", level: 5, bonus: 1 },
      ];
      expect(checkRequirement(requirement, character)).toBe(true);
    });

    it("returns false for an unknown derived key instead of throwing", () => {
      const character = baseCharacter();
      character.powers = [{ ...CreateDefaultPower(), type: "moc", level: 9, bonus: 9 }];
      expect(checkRequirement({ kind: "ranked", group: "derived", targetKey: "nieznane", value: 1 }, character)).toBe(false);
    });
  });

  describe("anyOf — alternative", () => {
    const eitherSource: Requirement = {
      kind: "anyOf",
      options: [
        { kind: "ranked", group: "powers", targetKey: "moc", value: 2 },
        { kind: "ranked", group: "powers", targetKey: "wiez", value: 2 },
      ],
    };

    it("is met when only the second option matches", () => {
      const character = baseCharacter();
      character.powers = [{ ...CreateDefaultPower(), type: "wiez", level: 2 }];
      expect(checkRequirement(eitherSource, character)).toBe(true);
    });

    it("is unmet when no option matches", () => {
      const character = baseCharacter();
      character.powers = [{ ...CreateDefaultPower(), type: "moc", level: 1 }];
      expect(checkRequirement(eitherSource, character)).toBe(false);
    });
  });

  describe("sum — additive requirement", () => {
    const mindPlusDexterity = (value: number): Requirement => ({
      kind: "sum",
      targets: [
        { group: "characteristics", targetKey: "mind" },
        { group: "characteristics", targetKey: "dexterity" },
      ],
      value,
    });

    it("adds the targets' total test values", () => {
      const character = baseCharacter();
      character.characteristics.mind = stat(5);
      character.characteristics.dexterity = stat(4);

      expect(checkRequirement(mindPlusDexterity(9), character)).toBe(true);
      expect(checkRequirement(mindPlusDexterity(10), character)).toBe(false);
    });

    it("counts bonuses, like a single-statistic requirement does", () => {
      const character = baseCharacter();
      character.characteristics.mind = stat(4, 1);
      character.characteristics.dexterity = stat(4, 0, 1);
      expect(checkRequirement(mindPlusDexterity(10), character)).toBe(true);
    });

    it("fails outright on an unknown key instead of quietly counting it as 0", () => {
      const character = baseCharacter();
      character.characteristics.mind = stat(20);
      const broken: Requirement = {
        kind: "sum",
        targets: [
          { group: "characteristics", targetKey: "mind" },
          { group: "characteristics", targetKey: "nieistniejąca" },
        ],
        value: 5,
      };
      expect(checkRequirement(broken, character)).toBe(false);
    });
  });

  // --- Wave 8 ---------------------------------------------------------------

  describe("count — „ilość czegoś\"", () => {
    it("counts across several groups at once", () => {
      const character = baseCharacter();
      character.stances = [{ ...CreateDefaultStance(), name: "A" }, { ...CreateDefaultStance(), name: "B" }];
      character.maneuvers = [{ ...CreateDefaultManeuver(), name: "C" }];

      const requirement: Requirement = { kind: "count", groups: ["stances", "maneuvers"], value: 3 };
      expect(checkRequirement(requirement, character)).toBe(true);
      expect(checkRequirement({ ...requirement, value: 4 }, character)).toBe(false);
    });

    it("filters by tag", () => {
      const character = baseCharacter();
      character.maneuvers = [
        { ...CreateDefaultManeuver(), name: "A", tags: ["widmowy"] },
        { ...CreateDefaultManeuver(), name: "B", tags: ["ofensywne"] },
      ];

      const requirement: Requirement = { kind: "count", groups: ["maneuvers"], tag: "widmowy", value: 2 };
      expect(checkRequirement(requirement, character)).toBe(false);
      expect(checkRequirement({ ...requirement, value: 1 }, character)).toBe(true);
    });

    it("filters by minimum grade — „pięć atutów ofensywnych na poziomie co najmniej 2\"", () => {
      const character = baseCharacter();
      character.perks = [
        { ...CreateDefaultPerk(), name: "A", grade: 2, tags: ["ofensywa"] },
        { ...CreateDefaultPerk(), name: "B", grade: 1, tags: ["ofensywa"] },
      ];

      const requirement: Requirement = { kind: "count", groups: ["perks"], tag: "ofensywa", minGrade: 2, value: 1 };
      expect(checkRequirement(requirement, character)).toBe(true);
      expect(checkRequirement({ ...requirement, value: 2 }, character)).toBe(false);
    });
  });

  describe("equipment — category, not a named item", () => {
    it("treats each armour weight as an exact category, not a scale", () => {
      const character = baseCharacter();
      character.equipment.armors = [{ ...character.equipment.armors[0]!, tags: ["średnie"] }];

      expect(checkRequirement({ kind: "ranked", group: "equipment", targetKey: "armor.średnia", value: 1 }, character)).toBe(true);
      // Heavier armour does NOT satisfy a light-armour requirement.
      expect(checkRequirement({ kind: "ranked", group: "equipment", targetKey: "armor.lekka", value: 1 }, character)).toBe(false);
      expect(checkRequirement({ kind: "ranked", group: "equipment", targetKey: "armor.ciężka", value: 1 }, character)).toBe(false);
    });

    it("scales shields by `block`, because their tags are empty", () => {
      const character = baseCharacter();
      character.equipment.shields = [{ ...character.equipment.shields[0]!, block: 9 }]; // Średnia Tarcza

      expect(checkRequirement({ kind: "ranked", group: "equipment", targetKey: "shield", value: 3 }, character)).toBe(true);
      expect(checkRequirement({ kind: "ranked", group: "equipment", targetKey: "shield", value: 4 }, character)).toBe(false);
    });

    it("treats a plain weapon category as membership", () => {
      const character = baseCharacter();
      character.equipment.weapons = [{ ...character.equipment.weapons[0]!, tags: ["miecze", "krótkie"] }];

      expect(checkRequirement({ kind: "ranked", group: "equipment", targetKey: "weapon.miecze", value: 1 }, character)).toBe(true);
      expect(checkRequirement({ kind: "ranked", group: "equipment", targetKey: "weapon.topory", value: 1 }, character)).toBe(false);
    });

    it("returns false for an unknown category instead of throwing", () => {
      expect(checkRequirement({ kind: "ranked", group: "equipment", targetKey: "nieznane", value: 1 }, baseCharacter())).toBe(false);
    });
  });

  describe("Siła Krytyka is an Atut, not a combat stat (ROADMAP 7.5)", () => {
    const requirement: Requirement = { kind: "ranked", group: "perks", targetKey: "Siła Krytyka", value: 2 };

    it("is met by owning the Atut at the required rank", () => {
      const character = baseCharacter();
      character.perks = [{ ...CreateDefaultPerk(), name: "Siła Krytyka", grade: 2 }];
      expect(checkRequirement(requirement, character)).toBe(true);
    });

    it("is NOT met by a high critical power coming from weapons or other perks", () => {
      const character = baseCharacter();
      character.perks = [{ ...CreateDefaultPerk(), name: "Ryzyko", grade: 1 }];
      character.offenses = character.offenses.map((offense) => ({
        ...offense,
        leadingWeapon: { ...offense.leadingWeapon, critical: { power: 9, range: 9 } },
      }));

      expect(checkRequirement(requirement, character)).toBe(false);
    });
  });
});
