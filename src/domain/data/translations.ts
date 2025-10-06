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
    category: "kategoria",
    characteristics: "cecha",
    attributes: "atrybut",
    description: "opis",
    penalty: "kara",

    defense: "defensywa",
    offense: "ofensywa",
    amount: "ilość",
    weaponDice: "kość broni",
    damageDice: "kość obrażeń",
    critical: "krytyk",
    range: "zasięg",
    power: "siła",
    style: "styl",
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