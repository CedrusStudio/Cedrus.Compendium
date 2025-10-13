import { CastTime } from "@/domain/characters/combat/Maneuver";

const defaultTranslations = 
{
    characters: "postacie",
    edit: "edycja",
    add: "dodawanie",
    vitality: "żywotność",
    toughness: "twardość",
    recoveryLevel: "regeneracja",
    lethalHealth: "przeżywalność",
    lethalRounds: "determinacja",

    strength: "siła",
    constitution: "kondycja",
    dexterity: "zręczność",
    mind: "umysł",
    charisma: "charyzma",
    spellborn: "czarokrwistość",

    fencing: "fechtunek",
    artifice: "fortel",
    precision: "precyzja",
    initiative: "inicjatywa",
    martialArt: "walka wręcz",
    horsemanship: "jeździectwo",

    fortitude: "wytrzymałość",
    reflex: "refleks",
    willpower: "wola",

    block: "blokowanie",
    parry: "parowanie",
    dodge: "unikanie",
    barrier: "bariera",
    castTime: "czas rzucania",
    cooldown: "odnowienie",
    protection: "pancerz",
    resistance: "odporność",
    immunity: "niewrażliwość",

    name: "nazwa",
    grade: "ranga",
    bonus: "bonus",
    category: "kategoria",
    statistics: "statystyki",
    characteristic: "cecha",
    characteristics: "cechy",
    attribute: "atrybut",
    attributes: "atrybuty",
    description: "opis",
    penalty: "kara",
    character: "postać",
    combat: "walka",
    talents: "umiejętności",
    equipment: "ekwipunek",
    testBonus: "bonus testu",
    value: "wartość",
    values: "wartości",
    
    defense: "defensywa",
    defenses: "defensywy",
    offense: "ofensywa",
    offenses: "ofensywy",
    amount: "ilość",
    weaponDice: "kość broni",
    damageDice: "kość obrażeń",
    critical: "krytyk",
    damage: "obrażenia",
    range: "zasięg",
    power: "siła",
    style: "styl",
    maneuvers: "manewry",
    stances: "postawy",
    states: "stany",
    weapons: "bronie",
    armor: "zbroja",
    armors: "zbroje",
    shields: "tarcze",
    inventory: "wyposażenie",
    mounts: "wierzchowce",

    bestiary: "bestiariusz",
    compendium: "kompendium",
    rulebook: "podręcznik",

    battle: "bitwa",
    sum: "suma",
    current: "obecne",
    health: "zdrowie",

    dark: 'ciemny',
    light: 'jasny',

    roll: "rzut",
    dexterityRestriction: "ograniczenie zręczności",
    initiativeRestriction: "ograniczenie inicjatywy",
    strengthRequirement: "wymaganie siły",
    selectCategory: "wybierz kategorię",
    selectCharacteristic: "wybierz cechę",
    changeDescription: "zmień opis...",
    clickSave: "kliknij zapisz, gdy skończysz.",

    changeName: "zmień nazwę...",
    addTalent: "dodaj umiejętność",
    clear: "wyczyść",
    cancel: "anuluj",
    close: "zamknij",
} as const;

export type TranslationKey = keyof typeof defaultTranslations;

export function translate(key: string): string 
{
    return defaultTranslations[key as TranslationKey] || key;
};

const pluralToSingularTranslations = 
{
    stances: "postawę",
    states: "stan",
};

export function translateToSingular(key: string): string 
{
    return pluralToSingularTranslations[key as keyof typeof pluralToSingularTranslations] || key;
};

const reductionTranslations = 
{
    full: "pełna",
    block: "blokowalna",
    direct: "bezpośrednia",
};

export function translateReductions(key: string): string 
{
    return reductionTranslations[key as keyof typeof reductionTranslations] || key;
};

export const castTimeTranslations: Record<CastTime, string> = 
{
  "Pełnorundowa": "full",
  "Standardowa": "standard",
  "Natychmiastowa": "immediate",
  "Nadnatychmiastowa": "overimmediate",
};
