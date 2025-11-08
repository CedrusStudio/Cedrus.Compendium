export const FORM_IDS = 
{
  COMBAT: "edit-combat-form",
  DETAILS: "edit-details-form",
  EQUIPMENT: "edit-equipment-form",
} as const;

export const createCharacterCacheKeys = (characterId: string): string[] => 
[
  'characters',
  `characters/${characterId}`,
  `characters/${characterId}/edit`,
];
