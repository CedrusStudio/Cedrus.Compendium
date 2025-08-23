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

export type Talent = 
{
  name: string;
  grade: number;
  bonus: number;
};

export type Health = 
{
  vitality: number;
  toughness: number;
  recoveryLevel: number;
  lethalHealthLevel: number;
  lethalHealthLevelRounds: number;
  barrier: number;
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

type Item = 
{
  name: string;
  description: string;
};

type Weapon = Item & 
{
  style: string;
  offense: WeaponOffense;
  range: number;
};

type Armor = Item & 
{
  protection: number;
  dexterityRestriction: number;
  reflexRestriction: number;
  initiativeRestriction: number;
  attributePenalty: number;
  strengthRequirement: number;
};

type Shield = Item & 
{
  block: number;
  dexterityRestriction: number;
  reflexRestriction: number;
  initiativeRestriction: number;
  attributePenalty: number;
  strengthRequirement: number;
};

type MagicEquipment = Item & 
{
  reduction: number;
  resistance: number;
  immunity: number;
};

type Horse = Item & 
{
  paceSpeed: number;
  gallopSpeed: number;
  canterSpeed: number;
  horsemanshipBonus: number;
};

type Equipment = 
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