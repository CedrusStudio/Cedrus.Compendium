import { translations_plPL } from "./translations/translation.pl-PL";
import { languageSettings } from "@/lib/env";

function translate(key: string): string 
{
    if (languageSettings.NEXT_LANGUAGE === 'pl-PL' && key in translations_plPL)
    {
        return translations_plPL[key as TranslationKey];
    }

    return key;
};

export type TranslationKey = keyof typeof displayedText;

export const displayedText = 
{
    characters: translate("characters"),
    edit: translate("edit"),
    add: translate("add"),
    vitality: translate("vitality"),
    toughness: translate("toughness"),
    recoveryLevel: translate("recoveryLevel"),
    lethalHealth: translate("lethalHealth"),
    lethalRounds: translate("lethalRounds"),

    strength: translate("strength"),
    constitution: translate("constitution"),
    dexterity: translate("dexterity"),
    mind: translate("mind"),
    charisma: translate("charisma"),
    spellborn: translate("spellborn"),

    fencing: translate("fencing"),
    artifice: translate("artifice"),
    precision: translate("precision"),
    initiative: translate("initiative"),
    martialArt: translate("martialArt"),
    horsemanship: translate("horsemanship"),

    fortitude: translate("fortitude"),
    reflex: translate("reflex"),
    willpower: translate("willpower"),

    block: translate("block"),
    parry: translate("parry"),
    dodge: translate("dodge"),
    barrier: translate("barrier"),
    castTime: translate("castTime"),
    cooldown: translate("cooldown"),
    protection: translate("protection"),
    resistance: translate("resistance"),
    immunity: translate("immunity"),

    name: translate("name"),
    short_name: translate("short_name"),
    grade: translate("grade"),
    bonus: translate("bonus"),
    category: translate("category"),
    statistics: translate("statistics"),
    characteristic: translate("characteristic"),
    characteristics: translate("characteristics"),
    attribute: translate("attribute"),
    attributes: translate("attributes"),
    description: translate("description"),
    penalty: translate("penalty"),
    character: translate("character"),
    combat: translate("combat"),
    talents: translate("talents"),
    equipment: translate("equipment"),
    testBonus: translate("testBonus"),
    value: translate("value"),
    values: translate("values"),
    
    defense: translate("defense"),
    defenses: translate("defenses"),
    offense: translate("offense"),
    offenses: translate("offenses"),
    amount: translate("amount"),
    weaponDice: translate("weaponDice"),
    damageDice: translate("damageDice"),
    critical: translate("critical"),
    damage: translate("damage"),
    range: translate("range"),
    power: translate("power"),
    style: translate("style"),
    maneuvers: translate("maneuvers"),
    stances: translate("stances"),
    states: translate("states"),
    weapons: translate("weapons"),
    armor: translate("armor"),
    armors: translate("armors"),
    shields: translate("shields"),
    inventory: translate("inventory"),
    mounts: translate("mounts"),

    bestiary: translate("bestiary"),
    compendium: translate("compendium"),
    rulebook: translate("rulebook"),

    battle: translate("battle"),
    sum: translate("sum"),
    current: translate("current"),
    health: translate("health"),

    dark: translate("dark"),
    light: translate("light"),
    action: translate("action"),

    roll: translate("roll"),
    attributePenalty: translate("attributePenalty"),
    dexterityRestriction: translate("dexterityRestriction"),
    initiativeRestriction: translate("initiativeRestriction"),
    strengthRequirement: translate("strengthRequirement"),
    selectCategory: translate("selectCategory"),
    selectCharacteristic: translate("selectCharacteristic"),
    changeDescription: translate("changeDescription"),
    clickSave: translate("clickSave"),

    changeName: translate("changeName"),
    changeGrade: translate("changeGrade"),
    addTalent: translate("addTalent"),
    clear: translate("clear"),
    cancel: translate("cancel"),
    close: translate("close"),
    create_new_character: translate("create_new_character"),

    selected: translate("selected"),
    from: translate("from"),

    addNewTalent: translate("addNewTalent"),
    editManeuver: translate("editManeuver"),
    editingItem: translate("editingItem"),
    pace: translate("pace"),
    gallop: translate("gallop"),
    canter: translate("canter"),
    horsemanshipBonus: translate("horsemanshipBonus"),

    increase: translate("increase"),
    all: translate("all"),
    columns: translate("columns"),
    delete: translate("delete"),
    deleting: translate("deleting"),

    leading: translate("leading"),
    secondary: translate("secondary"),
    damageBonus: translate("damageBonus"),

    searchByName: translate("searchByName"),
    searchCharacter: translate("searchCharacter"),
    saving: translate("saving"),
    save: translate("save"),
    deleteConfirmation: translate("deleteConfirmation"),
    deleteConfirmationDescription: translate("deleteConfirmationDescription"),

    paceSpeed: translate("paceSpeed"),
    canterSpeed: translate("canterSpeed"),
    gallopSpeed: translate("gallopSpeed"),

    addedToBattle: translate("addedToBattle"),
    removedFromBattle: translate("removedFromBattle"),

    applicationDescription: translate("applicationDescription"),
    applicationHeading: translate("applicationHeading"),

    editingMode: translate("editingMode"),
    actions: translate("actions"),
    showStancesStatesManeuvers: translate("showStancesStatesManeuvers"),
    goToCharacterView: translate("goToCharacterView"),

    changeGallop: translate("changeGallop"),
    changePace: translate("changePace"),
    changeCanter: translate("changeCanter"),
    changeHorsemanshipBonus: translate("changeHorsemanshipBonus"),
} as const;