import type { CharacterTabs } from "@/common/tabsUtils";

export const characterEditFormIds = {
  statistics: "edit-statistics-form",
  character: "edit-details-form",
  combat: "edit-combat-form",
  buffs: "edit-buffs-form",
  talents: "edit-talents-form",
  equipment: "edit-equipment-form",
} as const satisfies Record<CharacterTabs, string>;

export const characterSaveKey = (characterId: string, tab: CharacterTabs) =>
  ["character-save", characterId, tab] as const;

export const createCharacterCacheKeys = (characterId: string): string[] => 
[
  'characters',
  `characters/${characterId}`,
  `characters/${characterId}/edit`,
];
