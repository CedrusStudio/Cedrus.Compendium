export const createCompendiumFormId = 
{
  maneuver: (id: string) => `edit-maneuver-${id}`,
  perk: (id: string) => `edit-perk-${id}`,
  spell: (id: string) => `edit-spell-${id}`,
  stance: (id: string) => `edit-stance-${id}`,
  state: (id: string) => `edit-state-${id}`,
  weapon: (id: string) => `edit-weapon-${id}`,
  armor: (id: string) => `edit-armor-${id}`,
  shield: (id: string) => `edit-shield-${id}`,
  inventoryItem: (id: string) => `edit-inventory-${id}`,
  mount: (id: string) => `edit-mount-${id}`,
} as const;
