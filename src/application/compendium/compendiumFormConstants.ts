export const createCompendiumFormId = 
{
  maneuver: (id: string) => `edit-maneuver-${id}`,
  perk: (id: string) => `edit-perk-${id}`,
  spell: (id: string) => `edit-spell-${id}`,
  stance: (id: string) => `edit-stance-${id}`,
  state: (id: string) => `edit-state-${id}`,
} as const;
