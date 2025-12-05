export const createCompendiumFormId = 
{
  maneuver: (id: string) => `edit-maneuver-${id}`,
  perk: (id: string) => `edit-perk-${id}`,
  race: (id: string) => `edit-race-${id}`,
  spell: (id: string) => `edit-spell-${id}`,
  powerSpecification: (id: string) => `edit-power-specification-${id}`,
  stance: (id: string) => `edit-stance-${id}`,
  state: (id: string) => `edit-state-${id}`,
  weapon: (id: string) => `edit-weapon-${id}`,
  armor: (id: string) => `edit-armor-${id}`,
  shield: (id: string) => `edit-shield-${id}`,
  inventoryItem: (id: string) => `edit-inventory-${id}`,
  mount: (id: string) => `edit-mount-${id}`,
} as const;
