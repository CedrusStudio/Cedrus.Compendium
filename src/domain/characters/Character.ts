import { Health } from "@/domain/characters/combat/Health";
import { CreateDefaultDefense, Defense } from "@/domain/characters/combat/Defense";
import { CreateDefaultOffense, Offense } from "@/domain/characters/combat/Offense";
import { Characteristics } from "@/domain/characters/statistics/Characteristics";
import { Attributes } from "@/domain/characters/statistics/Attributes";
import { CreateDefaultTalent, Talent } from "@/domain/characters/Talent";
import { Equipment } from "@/domain/characters/equipment/Equipment";
import { CreateDefaultStance, CreateDefaultState, Mode } from "@/domain/characters/combat/Mode";
import { CreateDefaultManeuver, Maneuver } from "@/domain/characters/combat/Maneuver";
import { defaultDiceGrade, defaultWeaponDiceAmount } from "@/domain/characters/diceDefaults";
import { ulid } from "ulid";

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

const emptyCharacter: Character = 
{ 
  id: '',
  name: "Nowa postać",
  shortName: "Nowa",
  category: "bohater",
  description: "Opis postaci",
  characteristics: 
  {
    strength: { grade: defaultDiceGrade, value: 0, bonus: 0, testBonus: 0 },
    dexterity: { grade: defaultDiceGrade, value: 0, bonus: 0, testBonus: 0 },
    constitution: { grade: defaultDiceGrade, value: 0, bonus: 0, testBonus: 0 }, 
    mind: { grade: defaultDiceGrade, value: 0, bonus: 0, testBonus: 0 },
    charisma: { grade: defaultDiceGrade, value: 0, bonus: 0, testBonus: 0 },
    spellborn: { grade: defaultDiceGrade, value: 0, bonus: 0, testBonus: 0 } 
  },
  
  attributes: 
  {
    fencing: { grade: defaultDiceGrade, value: 0, bonus: 0, testBonus: 0 },
    artifice: { grade: defaultDiceGrade, value: 0, bonus: 0, testBonus: 0 },
    precision: { grade: defaultDiceGrade, value: 0, bonus: 0, testBonus: 0 },
    initiative: { grade: defaultDiceGrade, value: 0, bonus: 0, testBonus: 0 },
    martialArt: { grade: defaultDiceGrade, value: 0, bonus: 0, testBonus: 0 },
    horsemanship: { grade: defaultDiceGrade, value: 0, bonus: 0, testBonus: 0 },
    fortitude: { grade: defaultDiceGrade, value: 0, bonus: 0, testBonus: 0 },
    reflex: { grade: defaultDiceGrade, value: 0, bonus: 0, testBonus: 0 },
    willpower: { grade: defaultDiceGrade, value: 0, bonus: 0, testBonus: 0 }
  },

  health: 
  {
    barrier: 0,
    vitality: 10,
    toughness: 0,
    recoveryLevel: 1,
    lethalHealth: 0,
    lethalRounds: 0,
    bonus: 0
  },

  defenses: [],
  offenses: [],
  stances: [],
  states: [],
  maneuvers: [],

  talents: [],

  equipment: 
  {
    weapons: 
    [
      {
        id: '01K744HGM39X4G9ZKYPGK71SJA',
        name: "Broń 1",
        style: "Jednoręczny",
        offense: 
        {
          amount: defaultWeaponDiceAmount,
          grade: defaultDiceGrade,
          bonus: 0,
          critical: 
          {
            power: 0,
            range: 0
          }
        },
        damageBonus: 
        {
          amount: 0,
          grade: 0,
          bonus: 0
        },
        range: 0,
        description: "Weapon 1 description"
      }
    ],
    armors:
    [
      {
        id: '01K744HSNEXYQ4Z28XE6VWEBA5',
        name: "Pancerz",
        protection: 0,
        immunity: 0,
        resistance: 0,
        dexterityRestriction: 0,
        reflexRestriction: 0,
        initiativeRestriction: 0,
        attributePenalty: 0,
        strengthRequirement: 0,
        description: "Opis pancerza"
      }
    ],
    shields: 
    [
      {
        id: '01K744J34AYVN6JASDVQEMNEBD',
        name: "Tarcza",
        block: 0,
        resistance: 0,
        dexterityRestriction: 0,
        reflexRestriction: 0,
        initiativeRestriction: 0,
        attributePenalty: 0,
        strengthRequirement: 0,
        description: "Opis tarczy"
      }
    ],
    inventory: 
    [
      {
        id: '01K744JA13TJNPNR3S6SYQE87E',
        name: "Przedmiot 1",
        description: "Opis przedmiotu 1"
      }
    ],
    mounts: []
  }
};

export function CreateEmptyCharacter({name, shortName, category, description}: {name: string, shortName: string, category: CharacterCategory, description: string}): Character
{
  const newCharacter = { ...emptyCharacter, id: ulid(), name, shortName, category, description };
  newCharacter.offenses = [CreateDefaultOffense()];
  newCharacter.defenses = [CreateDefaultDefense()];
  newCharacter.maneuvers = [CreateDefaultManeuver()];
  newCharacter.stances = [CreateDefaultStance()];
  newCharacter.states = [CreateDefaultState()];
  newCharacter.talents = [CreateDefaultTalent()];
  return newCharacter;
};