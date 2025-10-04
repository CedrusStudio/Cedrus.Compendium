const translations = 
{
    characters: "postacie",
    edit: "edycja",
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
    block: "blokowanie",
    parry: "parowanie",
    dodge: "unikanie",
    barrier: "bariera",
    castTime: "czas rzucania",
    cooldown: "odnowienie",
};

export type TranslationKey = keyof typeof translations;

export function translate(key: string): string 
{
    console.log("Translating key:", key);
    return translations[key as TranslationKey] || key;
};