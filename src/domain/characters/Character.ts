import { PathsFrom } from "@/common/global/pathTypes";
import { CastTime } from "@/domain/data/castTimes";

export type Character =
{
  readonly id: string;
  name: string;
  description: string;
  category?: string;
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
  readonly id: string;
  category: string;
  name: string;
  characteristics: string;
  grade: number;
  bonus: number;
  penalty?: string;
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

export function calculateTotalHealthForCharacter(character: Character): number
{
  return character.health.vitality 
    + character.health.toughness * character.characteristics.constitution.value
    + character.characteristics.constitution.bonus 
    + character.attributes.fortitude.value
    + character.health.bonus;
}

export function calculateTotalHealth(health: Health, constitution: Statistic, fortitude: Statistic): number
{
  return health.vitality 
    + health.toughness * constitution.value
    + constitution.bonus 
    + fortitude.value
    + health.bonus;
}

export type Defense = 
{
  readonly id: string;
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

export type ReductionType = "full" | "block" | "direct";
export const allReductionTypes: ReductionType[] = ["full", "block", "direct"];

export function calculateSelectedReduction(defense: Defense, selectedReductionType: ReductionType): number 
{
  if (selectedReductionType === "full") 
  {
    return defense.block + defense.parry + defense.dodge + defense.bonus + defense.protection;
  }

  if (selectedReductionType === "block") 
  {
    return defense.block + defense.bonus + defense.protection;
  }

  if (selectedReductionType === "direct") 
  {
    return defense.bonus + defense.protection;
  }

  throw new Error("Invalid reduction type");
}

export function reductionSelectFilter(selectedReductionType: ReductionType): (name: string) => boolean
{
  if (selectedReductionType === "full") return fullFilter;
  if (selectedReductionType === "block") return blockFilter;
  if (selectedReductionType === "direct") return directFilter;
  throw new Error("Invalid reduction type");
}

function fullFilter(name: string): boolean 
{
  return name !== "immunity" 
    && name !== "resistance"
    && name !== "name"
    && name !== "description"
    && name !== "id";
} 

function blockFilter(name: string): boolean 
{
  return fullFilter(name) && name !== "dodge" && name !== "parry";
} 

function directFilter(name: string): boolean 
{
  return blockFilter(name) && name !== "block";
}

export type Offense = 
{
  readonly id: string;
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
};

export const pathToDefenseField = <K extends keyof Defense>(index: number, field: K): `defenses.${number}.${K}` => `defenses.${index}.${field}`;

export type WeaponOffense =
{
  amount: number;
  grade: number;
  bonus: number;
  critical: Critical;
}

export const pathToOffenseField = <K extends keyof Offense>(index: number, field: K): `offenses.${number}.${K}` => `offenses.${index}.${field}`;
export const leadingOffenseField = (index: number) => pathToOffenseField(index, "leadingWeapon");
export const secondaryOffenseField = (index: number) => pathToOffenseField(index, "secondaryWeapon");
export const damageOffenseField = (index: number) => pathToOffenseField(index, "damageBonus");
export type WeaponOffensePath =`offenses.${number}.${PathsFrom<Offense, WeaponOffense | undefined>}`;
export type DamageOffensePath = Exclude<`offenses.${number}.${PathsFrom<Offense, DamageOffense>}`, WeaponOffensePath>;

export type Critical =
{
  power: number;
  range: number;
}

export function calculateRange(weaponOffense: WeaponOffense): string
{
  return `${Math.max(weaponOffense.grade * 2 - weaponOffense.critical.range, 0)}-${weaponOffense.grade * 2}`;
}

export function rollDamage(offense: Offense)
{
  const rollForLeadingWeapon = handleWeaponDamageRolls(offense.leadingWeapon);
  const rollForSecondaryWeapon = offense.secondaryWeapon ? handleWeaponDamageRolls(offense.secondaryWeapon).total : 0;
  const rollForDamageBonus = handleDamageBonusRolls(offense.damageBonus);

  return rollForLeadingWeapon.total + rollForSecondaryWeapon + rollForDamageBonus.total;
}

export function handleWeaponDamageRolls(offense: WeaponOffense) : { total: number, rolls: [number, boolean][] }
{
  let totalOffenseDamage = 0;
  const rolls: [number, boolean][] = [];

  for (let i = 0; i < offense.amount; i++) 
  {
    const [damageWithoutCritical, criticalDamage] = handleWeaponDamageRoll(offense);
    const weaponDiceDamageWithoutCritical = damageWithoutCritical + offense.bonus;
    rolls.push([damageWithoutCritical, criticalDamage > 0]);
    totalOffenseDamage += (weaponDiceDamageWithoutCritical + criticalDamage);
  }

  return { total: totalOffenseDamage, rolls };
};

export function handleWeaponDamageRoll(offense: WeaponOffense) : [damage: number, critical: number]
{
  const weaponDamageRoll = handleWeaponOffenseRoll(offense);
  const criticalDamage = handleCriticalDamage(offense, weaponDamageRoll);
  return [ weaponDamageRoll, criticalDamage ];
}

export function handleDamageBonusRolls(damageOffense: DamageOffense)
{
  let totalDamageBonus = 0;
  const rolls: number[] = [];

  for (let i = 0; i < damageOffense.amount; i++) 
  {
    const damageBonusRoll = handleDamageOffenseRoll(damageOffense);
    rolls.push(damageBonusRoll);
    totalDamageBonus += damageBonusRoll;
  }

  return { total: totalDamageBonus + damageOffense.bonus, rolls };
}

function handleWeaponOffenseRoll(offense: WeaponOffense): number
{
  return Math.floor(Math.random() * offense.grade * 2) + 1;
}

export function handleDamageOffenseRoll(damageOffense: DamageOffense): number
{
  return Math.floor(Math.random() * damageOffense.grade * 2) + 1;
}

export function handleCriticalDamage(offense: WeaponOffense, roll: number): number
{
  return roll >= (offense.grade * 2 - offense.critical.range) ? offense.critical.power : 0;
}

export type Statistic = 
{
  grade: number;
  value: number;
  bonus: number;
  testBonus: number;
};

export function getStatisticTotalTestValue(statistic: Statistic): number
{
  return statistic.value + statistic.bonus + statistic.testBonus;
}

//Modes
export type Mode =
{
  readonly id: string;
  name: string;
  grade: number;
  description: string;
}

export type ModesType = "stances" | "states";

//Equipment
export type Item = 
{
  readonly id: string;
  name: string;
  description: string;
};

export type Weapon = Item & 
{
  style: Style;
  offense: WeaponOffense;
  damageBonus: DamageOffense;
  range: number;
};

export type Style = "None" | "Jednoręczny" | "Dwuręczny" | "Dystansowy" | "Rzucony" | "Półtoraręczny";
export const allowedStyles = ["None", "Jednoręczny", "Dwuręczny", "Dystansowy", "Rzucony", "Półtoraręczny"] as const satisfies readonly Style[];

export type DefensiveItem = Item &
{
  resistance: number;
  dexterityRestriction: number;
  reflexRestriction: number;
  initiativeRestriction: number;
  attributePenalty: number;
  strengthRequirement: number;
};

export const penaltyValues = [ 
  "x1", 
  "x1-1", 
  "x1-2", 
  "x1-3", 
  "x1+1", 
  "x1+2", 
  "x1+3", 
  "x2", 
  "x2-1", 
  "x2-2", 
  "x2-3", 
  "x2+1", 
  "x2+2", 
  "x2+3", 
  "x3", 
  "x4"
] as const satisfies readonly string[];

export const attributePenaltyValues = [ 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10 ] as const;
export const dexterityRestrictionValues = [ 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10 ] as const;
export const initiativeRestrictionValues = [ 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10 ] as const;
export const strengthRequirementValues = [ 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10 ] as const;

export type Armor = DefensiveItem & 
{
  immunity: number;
  protection: number;
};

export const protectionValues = 
[ 
  0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10,
  11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 
  21, 22, 23, 24, 25, 26, 27, 28, 29, 30,
  31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 
  41, 42, 43, 44, 45, 46, 47, 48, 49, 50
];

export type Shield = DefensiveItem & 
{
  block: number;
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

export const pathToHorseField = <K extends keyof Horse>(index: number, field: K): `horses.${number}.${K}` => `horses.${index}.${field}`;

export type Equipment = 
{
  weapons: Weapon[];
  armors: Armor[];
  shields: Shield[];
  inventory: Item[];
  horses: Horse[];
};

export type EquipmentItemArraysTypes = `weapons` | `armors` | `shields` | `horses` | `inventory`;
export type EquipmentItemTypes = `weapons.${number}` | `armors.${number}` | `shields.${number}` | `horses.${number}` | `inventory.${number}`;

export const splitEquipmentItemTypes = (type: EquipmentItemTypes): { name: EquipmentItemArraysTypes; index: number } => 
{
  const parts = type.split('.');
  return {
    name: parts[0] as EquipmentItemArraysTypes,
    index: parseInt(parts[1]),
  };
};

export const pathToWeaponsField = <K extends keyof Weapon>(index: number, field: K): `weapons.${number}.${K}` => `weapons.${index}.${field}`;
export const pathToWeaponsWeaponOffenseField = <K extends keyof WeaponOffense>(index: number, field: K): `weapons.${number}.offense.${K}` => `weapons.${index}.offense.${field}`;
export const pathToWeaponsWeaponOffenseCriticalField = <K extends keyof Critical>(index: number, field: K): `weapons.${number}.offense.critical.${K}` => `weapons.${index}.offense.critical.${field}`;
export const pathToWeaponsDamageOffenseField = <K extends keyof DamageOffense>(index: number, field: K): `weapons.${number}.damageBonus.${K}` => `weapons.${index}.damageBonus.${field}`;

export const pathToArmorsField = <K extends keyof Armor>(index: number, field: K): `armors.${number}.${K}` => `armors.${index}.${field}`;
export const pathToShieldsField = <K extends keyof Shield>(index: number, field: K): `shields.${number}.${K}` => `shields.${index}.${field}`;
export const pathToHorsesField = <K extends keyof Horse>(index: number, field: K): `horses.${number}.${K}` => `horses.${index}.${field}`;
export const pathToInventoryField = <K extends keyof Item>(index: number, field: K): `inventory.${number}.${K}` => `inventory.${index}.${field}`;

//Maneuvers
export type Maneuver =
{
  readonly id: string;
  name: string;
  grade: number;
  description: string;
  cooldown?: number;
  castTime: CastTime;
};