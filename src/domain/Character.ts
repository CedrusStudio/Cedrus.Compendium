export type Character =
{
    id: string;
    name: string;
    description: string;
    characteristics: Characteristics;
    attributes: Attributes;
    talents: Talent[];
    health: Health;
    defense: Defense;
    offense: Offense;
    equipment: Equipment;
    stances: Mode[];
    states: Mode[];
    // maneuvers: string;
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

//Talents

export type Talent = 
{
  category: string;
  name: string;
  characteristics: string;
  grade: number;
  bonus: number;
  penalty: number;
};

export const talentCategories = 
[
  "sense",
  "language",
  "proficiency",
  "scholarship",
  "profession",
];

export const senseCategory = 
[
  "perception",
  "listening",
  "smell",
  "taste",
  "direction sense",
];

export const languageCategory =
[
  "divine",
  "elvish",
  "dwarvish",
  "fey",
];

export const proficiencyCategory =
[
  "swimming",
  "climbing",
  "acrobatics",
  "stealth",
  "pick pocketing",
  "lock picking",
  "rope use",
  "escape artist",
  "balance",
  "sleight of hand",
  "stillness",
  "first aid",
  "survival",
  "tracking",
  "forgery",
  "cooking",
  "search",
  "hide",
  "appraise",
  "use device",
  "acting",
  "bluff",
  "diplomacy",
  "etiquette",
  "musical instrument",
  "juggling",
  "rhetoric",
  "singing",
  "dancing",
  "animal handling",
  "performance",
  "intimidation",
  "gather information",
  "animal empathy",
  "inner power",
];

export const scholarshipCategory = 
[
  "ancient lore",
  "arcane knowledge",
  "history",
  "religion",
  "nature",
  "blacksmithing",
];

export type Health = 
{
  barrier: number;
  vitality: number;
  toughness: number;
  recoveryLevel: number;
  lethalHealthLevel: number;
  lethalHealthLevelRounds: number;
  bonus: number;
};

export type Defense = 
{
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
  protection: number;
  dexterityRestriction: number;
  reflexRestriction: number;
  initiativeRestriction: number;
  attributePenalty: number;
  strengthRequirement: number;
};

export type Shield = Item & 
{
  block: number;
  dexterityRestriction: number;
  reflexRestriction: number;
  initiativeRestriction: number;
  attributePenalty: number;
  strengthRequirement: number;
};

export type MagicEquipment = Item & 
{
  reduction: number;
  resistance: number;
  immunity: number;
};

export type Horse = Item & 
{
  paceSpeed: number;
  gallopSpeed: number;
  canterSpeed: number;
  horsemanshipBonus: number;
};

export type Equipment = 
{
  weapon1: Weapon;
  weapon2?: Weapon;
  weapon3?: Weapon;
  weapon4?: Weapon;
  armor: Armor;
  shield: Shield;
  magicEquipment: MagicEquipment[];
  horse?: Horse;
};