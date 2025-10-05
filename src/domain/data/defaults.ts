import { Character, Maneuver, Mode, Talent, WeaponOffense } from "@/domain/characters/Character";

export const defaultGrade = 3;
export const defaultWeaponDiceAmount = 2;
export const defaultDamageDiceAmount = 1;

export const defaultWeaponOffense: WeaponOffense = 
{
  amount: 1,
  grade: 3,
  bonus: 0,
  critical: { power: 0, range: 0 }
} as const;

export const CreateWeaponOffense = (): WeaponOffense => ({
  amount: 1,
  grade: 3,
  bonus: 0,
  critical: { power: 0, range: 0 }
});

export const defaultManeuver: Maneuver =
{ 
  name: `Manewr`, 
  description: 'Opis manewru', 
  grade: 1, 
  castTime: "Standardowa", 
  cooldown: 1 
};

export const CreateDefaultManeuver = (): Maneuver => ({...defaultManeuver, name: `Maneuver ${crypto.randomUUID()}`});

export const defaultStance: Mode =
{
  name: `Postawa`,
  description: 'Opis postawy',
  grade: 1
};

export const defaultState: Mode =
{
  name: `Stan`,
  description: 'Opis stanu',
  grade: 1
};

export const CreateDefaultStance = (): Mode => ({...defaultStance, name: `Postawa ${crypto.randomUUID()}`});
export const CreateDefaultState = (): Mode => ({...defaultState, name: `Stan ${crypto.randomUUID()}`});

export const defaultTalent: Talent =
{
  name: "",
  category: "",
  characteristics: "",
  id: '',
  bonus: 0,
  penalty: 0,
  grade: 0
};

export const emptyCharacter: Character = 
{ 
    id: "", // Will be set when adding the character
    name: "", // Will be provided by characterHeader
    description: "", // Will be provided by characterHeader
    
    characteristics: 
    {
        strength: { grade: defaultGrade, value: 0, bonus: 0, testBonus: 0 },
        dexterity: { grade: defaultGrade, value: 0, bonus: 0, testBonus: 0 },
        constitution: { grade: defaultGrade, value: 0, bonus: 0, testBonus: 0 }, 
        mind: { grade: defaultGrade, value: 0, bonus: 0, testBonus: 0 },
        charisma: { grade: defaultGrade, value: 0, bonus: 0, testBonus: 0 },
        spellborn: { grade: defaultGrade, value: 0, bonus: 0, testBonus: 0 } 
    },
    
    attributes: 
    {
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

    defenses: 
    [
        {
            name: "Domyślna",
            description: "Opis domyślnej defensywy",
            immunity: 0,
            resistance: 0,
            protection: 0,
            block: 0,
            parry: 0,
            dodge: 0,
            bonus: 0
        
        }
    ],

    offenses:
    [
        {
            name: "Domyślna",
            description: "Opis domyślnej ofensywy",
            leadingWeapon: 
            {
                amount: defaultWeaponDiceAmount,
                grade: defaultGrade,
                bonus: 0,
                critical: 
                {
                    power: 0,
                    range: 0
                }
            },
            secondaryWeapon: undefined, 
            damageBonus: 
            {
                amount: 0,
                grade: defaultDamageDiceAmount,
                bonus: 0
            }
        }
    ],
    stances: [],
    states: [],
    maneuvers: [],

    talents: [],

    equipment: 
    {
        weapons: 
        [
            {
                name: "Broń 1",
                style: "",
                offense: 
                {
                    amount: defaultWeaponDiceAmount,
                    grade: defaultGrade,
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
                name: "Przedmiot 1",
                description: "Opis przedmiotu 1"
            }
        ],
        horses: []
    }
};