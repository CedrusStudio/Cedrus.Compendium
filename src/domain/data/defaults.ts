import { ulid } from 'ulid';
import { Armor, Character, Defense, Horse, Item, Maneuver, Mode, Offense, Shield, Talent, Weapon, WeaponOffense } from "@/domain/characters/Character";

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

export const defaultManeuver: Omit<Maneuver, "id"> =
{ 
  name: `Manewr`, 
  description: 'Opis manewru', 
  grade: 1, 
  castTime: "Standardowa", 
  cooldown: 1 
};

export const CreateDefaultManeuver = (): Maneuver => ({...defaultManeuver, id: ulid()});

export const defaultStance: Omit<Mode, "id"> =
{
  name: `Postawa`,
  description: 'Opis postawy',
  grade: 1
};

export const defaultState: Omit<Mode, "id"> =
{
  name: `Stan`,
  description: 'Opis stanu',
  grade: 1
};

export const CreateDefaultStance = (): Mode => ({...defaultStance, id: ulid()});
export const CreateDefaultState = (): Mode => ({...defaultState, id: ulid()});

export const defaultTalent: Omit<Talent, "id"> =
{
  name: "Talent 1",
  category: "Kategoria",
  characteristics: "siła",
  bonus: 0,
  penalty: 0,
  grade: 3
};

export const CreateDefaultTalent = (): Talent => ({...defaultTalent, id: ulid()});

export const defaultWeapon: Omit<Weapon, "id"> =
{
    name: "Nowa broń",
    description: "Opis broni",
    style: "Jednoręczny",
    range: 1,
    damageBonus: { amount: 1, grade: 6, bonus: 0 },
    offense: { amount: 1, grade: 6, bonus: 0, critical: { range: 20, power: 2 } },
};

export const defaultArmor: Omit<Armor, "id"> =
{
    name: "Nowa zbroja",
    description: "Opis zbroi",
    protection: 0,
    immunity: 0,
    resistance: 0,
    dexterityRestriction: 0,
    reflexRestriction: 0,
    initiativeRestriction: 0,
    attributePenalty: 0,
    strengthRequirement: 0,
};

export const defaultShield: Omit<Shield, "id"> =
{
    name: "Nowa tarcza",
    description: "Opis tarczy",
    block: 0,
    resistance: 0,
    dexterityRestriction: 0,
    reflexRestriction: 0,
    initiativeRestriction: 0,
    attributePenalty: 0,
    strengthRequirement: 0,
};

export const defaultInventoryItem: Omit<Item, "id"> =
{
    name: "Nowy przedmiot",
    description: "Opis przedmiotu"
};

export const defaultHorse: Omit<Horse, "id"> =
{
    name: "Nowy koń",
    description: "Opis konia",
    canterSpeed: 1,
    gallopSpeed: 1,
    horsemanshipBonus: 0,
    paceSpeed: 1
};

export const CreateDefaultWeapon = (): Weapon => ({...defaultWeapon, id: ulid()});
export const CreateDefaultArmor = (): Armor => ({...defaultArmor, id: ulid()});
export const CreateDefaultShield = (): Shield => ({...defaultShield, id: ulid()});
export const CreateDefaultInventoryItem = (): Item => ({...defaultInventoryItem, id: ulid()});
export const CreateDefaultHorse = (): Horse => ({...defaultHorse, id: ulid()});

const defaultOffense: Omit<Offense, "id"> =
{
    name: "Nowa Ofensywa",
    description: "Opis ofensywy",
    leadingWeapon: defaultWeaponOffense,
    secondaryWeapon: undefined,
    damageBonus: { amount: 1, grade: 3, bonus: 0 }
};

const defaultDefense: Omit<Defense, "id"> =
{
    name: "Nowa Defensywa",
    description: "Opis defensywy",
    immunity: 0,
    resistance: 0,
    protection: 0,
    block: 0,
    parry: 0,
    dodge: 0,
    bonus: 0
};

export const CreateDefaultOffense = (): Offense => ({...defaultOffense, id: ulid()});
export const CreateDefaultDefense = (): Defense => ({...defaultDefense, id: ulid()});

const emptyCharacter: Character = 
{ 
    id: '',
    name: "Nowa postać",
    description: "Opis postaci",
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
        horses: []
    }
};

export function CreateEmptyCharacter(name: string, description: string): Character
{
    const newCharacter = { ...emptyCharacter, id: ulid(), name, description };
    newCharacter.offenses = [CreateDefaultOffense()];
    newCharacter.defenses = [CreateDefaultDefense()];
    newCharacter.maneuvers = [CreateDefaultManeuver()];
    newCharacter.stances = [CreateDefaultStance()];
    newCharacter.states = [CreateDefaultState()];
    newCharacter.talents = [CreateDefaultTalent()];
    return newCharacter;
};