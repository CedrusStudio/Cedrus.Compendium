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

//Talents

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
  lethalHealth: number;
  lethalRounds: number;
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

export type ItemTypes = "weapon1" | "weapon2" | "weapon3" | "weapon4" | "armor" | "shield" | "horse";

//Maneuvers

export type CastTime = "Full" | "Standard" | "Immediate" | "Overimmediate";
export const castTimeValues = [
  "Full",
  "Standard",
  "Immediate",
  "Overimmediate",
] as const satisfies readonly CastTime[];

export type Maneuver =
{
  name: string;
  grade: number;
  description: string;
  cooldown: number | undefined;
  castTime: CastTime;
};

export const defaultGrade = 3;
export const defaultWeaponDiceAmount = 2;
export const defaultDamageDiceAmount = 1;

//Empty Character
export const emptyCharacter: Character = { 
    // Required fields - these need to be provided when creating a character
    id: "", // Will be set when adding the character
    name: "", // Will be provided by characterHeader
    description: "", // Will be provided by characterHeader
    
    // Characteristics - corrected to match the type definition
    characteristics: {
        strength: { grade: defaultGrade, value: 0, bonus: 0, testBonus: 0 },
        dexterity: { grade: defaultGrade, value: 0, bonus: 0, testBonus: 0 },
        constitution: { grade: defaultGrade, value: 0, bonus: 0, testBonus: 0 }, // Added missing field
        mind: { grade: defaultGrade, value: 0, bonus: 0, testBonus: 0 },
        charisma: { grade: defaultGrade, value: 0, bonus: 0, testBonus: 0 }, // Corrected from fellowship
        spellborn: { grade: defaultGrade, value: 0, bonus: 0, testBonus: 0 } // Corrected from willpower
    },
    
    // Attributes - corrected to match the type definition
    attributes: {
        fencing: { grade: defaultGrade, value: 0, bonus: 0, testBonus: 0 },
        artifice: { grade: defaultGrade, value: 0, bonus: 0, testBonus: 0 },
        precision: { grade: defaultGrade, value: 0, bonus: 0, testBonus: 0 },
        initiative: { grade: defaultGrade, value: 0, bonus: 0, testBonus: 0 },
        martialArt: { grade: defaultGrade, value: 0, bonus: 0, testBonus: 0 },
        horsemanship: { grade: defaultGrade, value: 0, bonus: 0, testBonus: 0 },
        fortitude: { grade: defaultGrade, value: 0, bonus: 0, testBonus: 0 },
        reflex: { grade: defaultGrade, value: 0, bonus: 0, testBonus: 0 },
        willpower: { grade: defaultGrade, value: 0, bonus: 0, testBonus: 0 }
    },

    // Health
    health: {
        barrier: 0,
        vitality: 10,
        toughness: 0,
        recoveryLevel: 1,
        lethalHealth: 0,
        lethalRounds: 0,
        bonus: 0
    },

    // Defense - corrected to match the type definition
    defense: {
        immunity: 0,
        resistance: 0,
        protection: 0,
        block: 0,
        parry: 0,
        dodge: 0,
        bonus: 0
    },

    // Offense
    offense: {
        leadingWeapon: {
            amount: defaultWeaponDiceAmount,
            grade: defaultGrade,
            bonus: 0,
            critical: {
                power: 0,
                range: 0
            }
        },
        secondaryWeapon: undefined, // Optional field
        damageBonus: {
            amount: 0,
            grade: defaultDamageDiceAmount,
            bonus: 0
        }
    },

    // Combat modes/states
    stances: [],
    states: [],
    maneuvers: [],

    // Talents - empty array
    talents: [],

    // Equipment - corrected to match the type definition
    equipment: {
        weapon1: {
            name: "Weapon 1",
            style: "",
            offense: {
                amount: defaultWeaponDiceAmount,
                grade: defaultGrade,
                bonus: 0,
                critical: {
                    power: 0,
                    range: 0
                }
            },
            damageBonus: {
                amount: 0,
                grade: 0,
                bonus: 0
            },
            range: 0,
            description: "Weapon 1 description"
        },
        weapon2: undefined, // Optional
        weapon3: undefined, // Optional
        weapon4: undefined, // Optional
        armor: {
            name: "Armor",
            protection: 0, // Corrected from defense
            dexterityRestriction: 0,
            reflexRestriction: 0,
            initiativeRestriction: 0,
            attributePenalty: 0,
            strengthRequirement: 0,
            description: "Armor description"
        },
        shield: {
            name: "Shield",
            block: 0, // Corrected from defense
            dexterityRestriction: 0,
            reflexRestriction: 0,
            initiativeRestriction: 0,
            attributePenalty: 0,
            strengthRequirement: 0,
            description: "Shield description"
        },
        magicEquipment: [],
        horse: undefined
    }
};