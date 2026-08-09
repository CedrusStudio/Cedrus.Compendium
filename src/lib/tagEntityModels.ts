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
 * `prisma/schema.prisma`. Needed by the raw-command path in Wave 10.0: renaming a
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

/**
 * Search-payload entity name → tag-management entity name.
 *
 * The two vocabularies are NOT the same: search says `maneuver` and
 * `inventoryItem`, tag management says `maneuvers` and `inventory`. Wave 10.3
 * needs the bridge because facets are keyed by the tag-management name — and
 * getting it wrong fails silently, since an index built for an entity no facet
 * lists simply yields no conditions and the filter quietly stops narrowing.
 */
export const searchEntityToTagEntity: Record<string, string> = {
  character: 'characters',
  maneuver: 'maneuvers',
  spell: 'spells',
  perk: 'perks',
  race: 'races',
  stance: 'stances',
  state: 'states',
  weapon: 'weapons',
  armor: 'armors',
  shield: 'shields',
  inventoryItem: 'inventory',
  mount: 'mounts',
  powerSpecification: 'powerSpecifications',
};
