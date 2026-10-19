import { ulid } from "ulid";
import { Health } from "@/domain/characters/combat/Health";
import { CreateDefaultDefense, Defense } from "@/domain/characters/combat/Defense";
import { CreateDefaultOffense, Offense } from "@/domain/characters/combat/Offense";
import { Characteristics } from "@/domain/characters/statistics/Characteristics";
import { Attributes } from "@/domain/characters/statistics/Attributes";
import { CreateDefaultTalent, Talent } from "@/domain/characters/Talent";
import { Equipment } from "@/domain/characters/equipment/Equipment";
import { CreateDefaultStance, CreateDefaultState, Mode } from "@/domain/characters/combat/Mode";
import { CreateDefaultManeuver, Maneuver } from "@/domain/characters/combat/Maneuver";
import { defaultDiceGrade, defaultWeaponDiceAmount } from "@/domain/diceDefaults";
import { CreateDefaultPower, Power } from "@/domain/characters/combat/Power";
import { CreateDefaultPerk, Perk } from "@/domain/characters/Perk";
import { BuffProfile } from "@/domain/characters/buffs/BuffProfile";
import { Tag } from "@/domain/Tag";
import { Entity } from "@/domain/Entity";
import { Race } from "@/domain/Race";
import type { CharacterMembershipSnapshot } from './characterMembership';

export type Character = Entity &
{
  shortName: string;
  description: string;
  tags: Tag[];
  race?: Race;

  /**
   * API keys allowed to see this character.
   * `undefined`/empty means the character is public (visible to everyone).
   */
  apiKeys?: string[];
  membershipSnapshot?: CharacterMembershipSnapshot;

  characteristics: Characteristics;
  attributes: Attributes;
  talents: Talent[];
  
  health: Health;
  defenses: Defense[];
  defaultDefenseId?: string;
  offenses: Offense[];
  defaultOffenseId?: string;
  equipment: Equipment;
  
  stances: Mode[];
  states: Mode[];
  maneuvers: Maneuver[];
  powers: Power[];
  perks: Perk[];
  buffProfiles: BuffProfile[];
  activeBuffProfileIds: string[];
  stanceModifierProfiles: BuffProfile[];
  activeStanceModifierProfileIds: string[];
  stateModifierProfiles: BuffProfile[];
  activeStateModifierProfileIds: string[];
  otherModifierProfiles: BuffProfile[];
  activeOtherModifierProfileIds: string[];
};

const emptyCharacter: Character = 
{ 
  id: '',
  name: "Nowa postać",
  shortName: "Nowa",
  tags: [],
  description: "Opis postaci",
  race: undefined,
  apiKeys: [],
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
  defaultDefenseId: undefined,
  offenses: [],
  defaultOffenseId: undefined,
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
          isPhantom: false,
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
          bonus: 0,
          isPhantom: false
        },
        range: 0,
        description: "Weapon 1 description",
        tags: []
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
        description: "Opis pancerza",
        tags: []
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
        description: "Opis tarczy",
        tags: []
      }
    ],
    inventory: 
    [
      {
        id: '01K744JA13TJNPNR3S6SYQE87E',
        name: "Przedmiot 1",
        description: "Opis przedmiotu 1",
        tags: []
      }
    ],
    mounts: []
  },
  powers: [],
  buffProfiles: [],
  activeBuffProfileIds: [],
  stanceModifierProfiles: [],
  activeStanceModifierProfileIds: [],
  stateModifierProfiles: [],
  activeStateModifierProfileIds: [],
  otherModifierProfiles: [],
  activeOtherModifierProfileIds: [],
  perks: 
  [
    {
      id: '01K7QBNAVF1VY58R2G1ASKYMZG',
      name: "Perk 1",
      description: "Opis perku 1",
      grade: 1,
      price: 2,
      tags: []
    }
  ]
};

export function CreateEmptyCharacter({name, shortName, tags, description}: {name: string, shortName: string, tags: Tag[], description: string}): Character
{
  const newCharacter = { ...emptyCharacter, id: ulid(), name, shortName, tags, description };
  const defaultOffense = CreateDefaultOffense();
  const defaultDefense = CreateDefaultDefense();
  newCharacter.offenses = [defaultOffense];
  newCharacter.defaultOffenseId = defaultOffense.id;
  newCharacter.defenses = [defaultDefense];
  newCharacter.defaultDefenseId = defaultDefense.id;
  newCharacter.maneuvers = [CreateDefaultManeuver()];
  newCharacter.stances = [CreateDefaultStance()];
  newCharacter.states = [CreateDefaultState()];
  newCharacter.talents = [CreateDefaultTalent()];
  newCharacter.powers = [CreateDefaultPower()];
  newCharacter.buffProfiles = [];
  newCharacter.activeBuffProfileIds = [];
  newCharacter.stanceModifierProfiles = [];
  newCharacter.activeStanceModifierProfileIds = [];
  newCharacter.stateModifierProfiles = [];
  newCharacter.activeStateModifierProfileIds = [];
  newCharacter.otherModifierProfiles = [];
  newCharacter.activeOtherModifierProfileIds = [];
  newCharacter.perks = [CreateDefaultPerk()];
  return structuredClone(newCharacter);
};
