import { translations_deDE } from "@/presentation/translations/translations.de-DE";
import { translations_plPL } from "@/presentation/translations/translations.pl-PL";
import { translations_frFR } from "@/presentation/translations/translations.fr-FR";
import { languageSettings } from "@/lib/env";

function translate(key: string): string 
{
    if (languageSettings.NEXT_LANGUAGE === 'pl-PL' && key in translations_plPL)
    {
        return translations_plPL[key as TranslationKey];
    }

    if (languageSettings.NEXT_LANGUAGE === 'de-DE' && key in translations_deDE)
    {
        return translations_deDE[key as TranslationKey];
    }

    if (languageSettings.NEXT_LANGUAGE === 'fr-FR' && key in translations_frFR)
    {
        return translations_frFR[key as TranslationKey];
    }

    return key;
};

export type TranslationKey = keyof typeof displayedText;

export const displayedText = 
{
    none: translate("none"),
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
    isPhantom: translate("isPhantom"),
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
    powers: translate("powers"),
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
    reflexRestriction: translate("reflexRestriction"),
    initiativeRestriction: translate("initiativeRestriction"),
    strengthRequirement: translate("strengthRequirement"),
    selectCategory: translate("selectCategory"),
    addTag: translate("addTag"),
    tagCannotBeEmpty: translate("tagCannotBeEmpty"),
    tagMustBeLowercaseAndSingleWord: translate("tagMustBeLowercaseAndSingleWord"),
    tagAlreadyExists: translate("tagAlreadyExists"),
    addString: translate("addString"),
    addRequirement: translate("addRequirement"),
    stringCannotBeEmpty: translate("stringCannotBeEmpty"),
    stringAlreadyExists: translate("stringAlreadyExists"),
    maximum: translate("maximum"),
    tagsAllowed: translate("tagsAllowed"),
    stringAllowed: translate("stringAllowed"),
    selectCharacteristic: translate("selectCharacteristic"),
    changeDescription: translate("changeDescription"),
    clickSave: translate("clickSave"),

    changeName: translate("changeName"),
    changeShortName: translate("changeShortName"),
    changeGrade: translate("changeGrade"),
    addTalent: translate("addTalent"),
    clear: translate("clear"),
    cancel: translate("cancel"),
    close: translate("close"),
    create_new_character: translate("create_new_character"),

    selected: translate("selected"),
    from: translate("from"),

    addNewTalent: translate("addNewTalent"),
    addManeuver: translate("addManeuver"),
    addPerk: translate("addPerk"),
    addSpell: translate("addSpell"),
    addStance: translate("addStance"),
    addState: translate("addState"),
    addPowerSpecification: translate("addPowerSpecification"),
    editManeuver: translate("editManeuver"),
    editPower: translate("editPower"),
    editSpell: translate("editSpell"),
    editPerk: translate("editPerk"),
    editStance: translate("editStance"),
    editState: translate("editState"),
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
    showStancesStates: translate("showStancesStates"),
    showManeuvers: translate("showManeuvers"),
    showPowers: translate("showPowers"),
    showPerks: translate("showPerks"),
    goToCharacterView: translate("goToCharacterView"),

    changeGallop: translate("changeGallop"),
    changePace: translate("changePace"),
    changeCanter: translate("changeCanter"),
    changeHorsemanshipBonus: translate("changeHorsemanshipBonus"),

    characterUpdatedSuccessfully: translate("characterUpdatedSuccessfully"),
    updatedSuccessfully: translate("updatedSuccessfully"),
    success: translate("success"),
    error: translate("error"),
    perk: translate("perk"),
    perks: translate("perks"),

    type: translate("type"),
    level: translate("level"),
    essence: translate("essence"),
    spells: translate("spells"),

    cost: translate("cost"),
    price: translate("price"),
    requirements: translate("requirements"),
    tags: translate("tags"),
    tag: translate("tag"),

    select_base_character: translate("select_base_character"),
    select_character_to_base_new_one: translate("select_character_to_base_new_one"),
    no_characters_found: translate("no_characters_found"),
    create_from_template: translate("create_from_template"),

    select_all: translate("select_all"),
    deselect_all: translate("deselect_all"),
    import: translate("import"),
    selected_items_hidden_by_filter: translate("selected_items_hidden_by_filter"),

    import_perks: translate("import_perks"),
    select_perks_to_import: translate("select_perks_to_import"),
    no_perks_found: translate("no_perks_found"),

    import_stances: translate("import_stances"),
    select_stances_to_import: translate("select_stances_to_import"),
    no_stances_found: translate("no_stances_found"),

    import_states: translate("import_states"),
    select_states_to_import: translate("select_states_to_import"),
    no_states_found: translate("no_states_found"),

    import_maneuvers: translate("import_maneuvers"),
    select_maneuvers_to_import: translate("select_maneuvers_to_import"),
    no_maneuvers_found: translate("no_maneuvers_found"),

    import_spells: translate("import_spells"),
    select_spells_to_import: translate("select_spells_to_import"),
    no_spells_found: translate("no_spells_found"),

    import_weapons: translate("import_weapons"),
    select_weapons_to_import: translate("select_weapons_to_import"),
    no_weapons_found: translate("no_weapons_found"),

    import_armors: translate("import_armors"),
    select_armors_to_import: translate("select_armors_to_import"),
    no_armors_found: translate("no_armors_found"),

    import_shields: translate("import_shields"),
    select_shields_to_import: translate("select_shields_to_import"),
    no_shields_found: translate("no_shields_found"),

    import_inventory: translate("import_inventory"),
    select_inventory_to_import: translate("select_inventory_to_import"),
    no_inventory_found: translate("no_inventory_found"),

    import_mounts: translate("import_mounts"),
    select_mounts_to_import: translate("select_mounts_to_import"),
    no_mounts_found: translate("no_mounts_found"),

    notFound: translate("notFound"),

    // Command Palette / Search
    searchShortcut: translate("searchShortcut"),
    searchPlaceholder: translate("searchPlaceholder"),
    searchNoResults: translate("searchNoResults"),
    searchSelectCategory: translate("searchSelectCategory"),

    loadMore: translate("loadMore"),
    loading: translate("loading"),
    
    rollInitiative: translate("rollInitiative"),
    manualInitiative: translate("manualInitiative"),
    rollAllInitiatives: translate("rollAllInitiatives"),
    clearAllInitiatives: translate("clearAllInitiatives"),
    sortByInitiative: translate("sortByInitiative"),
    initiativeValue: translate("initiativeValue"),
    
    duplicateCharacter: translate("duplicateCharacter"),
    characterDuplicated: translate("characterDuplicated"),
    copy: translate("copy"),
    
    addExternalParticipant: translate("addExternalParticipant"),
    externalParticipant: translate("externalParticipant"),
    externalParticipantAdded: translate("externalParticipantAdded"),
    addExternalParticipantDescription: translate("addExternalParticipantDescription"),
    enterName: translate("enterName"),
    enterNotes: translate("enterNotes"),
    notes: translate("notes"),
    maxHealth: translate("maxHealth"),
    currentHealth: translate("currentHealth"),
    nameRequired: translate("nameRequired"),
    changesSaved: translate("changesSaved"),
    removed: translate("removed"),
    initiativeGrade: translate("initiativeGrade"),
    editInitiative: translate("editInitiative"),
    editInitiativeDescription: translate("editInitiativeDescription"),
    deleteParticipant: translate("deleteParticipant"),
    confirmDelete: translate("confirmDelete"),
    initiativeUpdated: translate("initiativeUpdated"),
    invalidGrade: translate("invalidGrade"),
} as const;