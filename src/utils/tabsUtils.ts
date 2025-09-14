const EDIT_CHARACTER_TABS = ["edit-character", "edit-combat", "edit-talents", "edit-equipment"] as const;
export type EditCharacterTabs = typeof EDIT_CHARACTER_TABS[number];

export const isEditCharacterTab = (v: unknown): v is EditCharacterTabs =>
    typeof v === "string" && EDIT_CHARACTER_TABS.includes(v as EditCharacterTabs);

const CHARACTER_TABS = ["character", "combat", "talents", "equipment"] as const;
export type CharacterTabs = typeof CHARACTER_TABS[number];

export const isCharacterTab = (v: unknown): v is CharacterTabs =>
    typeof v === "string" && CHARACTER_TABS.includes(v as CharacterTabs);