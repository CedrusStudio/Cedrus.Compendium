export const AI_CATALOG_KINDS = [
  'race', 'perk', 'maneuver', 'stance', 'state', 'spell', 'powerSpecification',
  'weapon', 'armor', 'shield', 'inventoryItem', 'mount',
] as const;

export type AiCatalogKind = (typeof AI_CATALOG_KINDS)[number];
