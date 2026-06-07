const CHARACTER_TABS = ["statistics", "character", "combat", "buffs", "talents", "equipment"] as const;
export type CharacterTabs = typeof CHARACTER_TABS[number];

export const isCharacterTab = (v: unknown): v is CharacterTabs =>
    typeof v === "string" && CHARACTER_TABS.includes(v as CharacterTabs);