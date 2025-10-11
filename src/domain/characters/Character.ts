import { Health } from "@/domain/characters/combat/Health";
import { Defense } from "@/domain/characters/combat/Defense";
import { Offense } from "@/domain/characters/combat/Offense";
import { Characteristics } from "@/domain/characters/statistics/Characteristics";
import { Attributes } from "@/domain/characters/statistics/Attributes";
import { Talent } from "@/domain/characters/Talent";
import { Equipment } from "@/domain/characters/equipment/Equipment";
import { Mode } from "@/domain/characters/combat/Mode";
import { Maneuver } from "@/domain/characters/combat/Maneuver";

export type Character =
{
  readonly id: string;
  shortName: string;
  name: string;
  description: string;
  category: CharacterCategory;
  characteristics: Characteristics;
  attributes: Attributes;
  talents: Talent[];
  health: Health;
  defenses: Defense[];
  offenses: Offense[];
  equipment: Equipment;
  stances: Mode[];
  states: Mode[];
  maneuvers: Maneuver[];
};

export type CharacterCategory = typeof allowedCharacterCategories[number];

export const allowedCharacterCategories = 
[
  "bohater",
  "wojak",
  "monstrum"
] as const satisfies readonly string[];