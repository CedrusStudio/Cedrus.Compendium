import { CastTime } from "@/domain/data/castTimes";

export type Character =
{
    id: string;
    name: string;
    description: string;
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

export type Characteristics = 
{
  strength: Statistic;
  dexterity: Statistic;
  constitution: Statistic;
  mind: Statistic;
  charisma: Statistic;
  spellborn: Statistic;
};

export type Attributes =
{
  fencing: Statistic;
  artifice: Statistic;
  precision: Statistic;
  initiative: Statistic;
  martialArt: Statistic;
  horsemanship: Statistic;

  fortitude: Statistic;
  reflex: Statistic;
  willpower: Statistic;
};

export type Talent = 
{
  id: string;
  category: string;
  name: string;
  characteristics: string;
  grade: number;
  bonus: number;
  penalty: number;
};

export type Health = 
{
  barrier: number;
  vitality: number;
  toughness: number;
  recoveryLevel: number;
  lethalHealth: number;
  lethalRounds: number;
  bonus: number;
};

export type Defense = 
{
  name: string;
  description?: string;
  immunity: number;
  resistance: number;
  protection: number;
  block: number;
  parry: number;
  dodge: number;
  bonus: number;
};

export type Offense = 
{
  name: string;
  description?: string;
  leadingWeapon: WeaponOffense;
  secondaryWeapon?: WeaponOffense;
  damageBonus: DamageOffense;
};

export type DamageOffense =
{
  amount: number;
  grade: number;
  bonus: number;
}

export type WeaponOffense =
{
  amount: number;
  grade: number;
  bonus: number;
  critical: Critical;
}

export type Critical =
{
  power: number;
  range: number;
}

export type Statistic = 
{
  grade: number;
  value: number;
  bonus: number;
  testBonus: number;
};

//Modes
export type Mode =
{
  name: string;
  grade: number;
  description: string;
}

export type ModesType = "stances" | "states";

//Equipment
export type Item = 
{
  name: string;
  description: string;
};

export type Weapon = Item & 
{
  style: string;
  offense: WeaponOffense;
  damageBonus: DamageOffense;
  range: number;
};

export type Armor = Item & 
{
  immunity: number;
  resistance: number;
  protection: number;
  dexterityRestriction: number;
  reflexRestriction: number;
  initiativeRestriction: number;
  attributePenalty: number;
  strengthRequirement: number;
};

export const protectionValues = 
[ 
  0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10,
  11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 
  21, 22, 23, 24, 25, 26, 27, 28, 29, 30,
  31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 
  41, 42, 43, 44, 45, 46, 47, 48, 49, 50
];

export const penaltyValues = [ 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10 ];
export const attributePenaltyValues = [ 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10 ];
export const dexterityRestrictionValues = [ 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10 ];
export const initiativeRestrictionValues = [ 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10 ];
export const strengthRequirementValues = [ 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10 ];

export type Shield = Item & 
{
  block: number;
  resistance: number;
  dexterityRestriction: number;
  reflexRestriction: number;
  initiativeRestriction: number;
  attributePenalty: number;
  strengthRequirement: number;
};

export const blockValues = 
[ 
  0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10,
  11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 
  21, 22, 23, 24, 25, 26, 27, 28, 29, 30,
  31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 
  41, 42, 43, 44, 45, 46, 47, 48, 49, 50
];

export type Horse = Item & 
{
  paceSpeed: number;
  gallopSpeed: number;
  canterSpeed: number;
  horsemanshipBonus: number;
};

export type Equipment = 
{
  weapons: Weapon[];
  armors: Armor[];
  shields: Shield[];
  inventory: Item[];
  horses: Horse[];
};

export type ItemTypes = "weapon" | "armor" | "shield" | "horse" | "inventory";

//Maneuvers
export type Maneuver =
{
  name: string;
  grade: number;
  description: string;
  cooldown?: number;
  castTime: CastTime;
};