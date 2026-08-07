export const tagEntityModelMap: Record<string, string> = {
  characters: 'character',
  weapons: 'weapon',
  armors: 'armor',
  shields: 'shield',
  spells: 'spell',
  perks: 'perk',
  races: 'race',
  maneuvers: 'maneuver',
  stances: 'stance',
  states: 'state',
  inventory: 'inventoryItem',
  mounts: 'mount',
  powerSpecifications: 'powerSpecification',
};

/**
 * Physical Mongo collection behind each entity, per the `@@map` directives in
 * `prisma/schema.prisma`. Needed by the raw-command path in Wave 9.0: renaming a
 * tag in one command instead of N round trips means addressing the collection
 * directly, and Prisma's model name is not always the collection name
 * (`inventoryItem` → `inventory`, and `PowerSpecification` has no `@@map` at all,
 * so it keeps its model name verbatim).
 */
export const tagEntityCollectionMap: Record<string, string> = {
  characters: 'characters',
  weapons: 'weapons',
  armors: 'armors',
  shields: 'shields',
  spells: 'spells',
  perks: 'perks',
  races: 'races',
  maneuvers: 'maneuvers',
  stances: 'stances',
  states: 'states',
  inventory: 'inventory',
  mounts: 'mounts',
  powerSpecifications: 'PowerSpecification',
};

/** Entities that carry `structuredRequirements` and can therefore hold `count` tag references. */
export const requirementBearingEntities: readonly string[] = ['maneuvers', 'stances', 'states', 'spells', 'perks'];
