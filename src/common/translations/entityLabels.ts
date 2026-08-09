import { tagEntityModelMap } from "@/lib/tagEntityModels";

/**
 * Polish names for the tag-management entities.
 *
 * The keys (`maneuvers`, `powerSpecifications`) are an internal vocabulary and
 * must never reach the screen — Wave 10.7 shipped an admin panel that printed
 * them raw. Pulled out of `/admin/tags` so the panel, the category editor and
 * the drift report all say the same thing.
 */
export const entityLabelsPl: Record<string, string> = {
  characters: "Postacie",
  weapons: "Bronie",
  armors: "Zbroje",
  shields: "Tarcze",
  spells: "Zaklęcia",
  perks: "Atuty",
  races: "Rasy",
  maneuvers: "Manewry",
  stances: "Postawy",
  states: "Stany",
  inventory: "Przedmioty",
  mounts: "Wierzchowce",
  powerSpecifications: "Moce",
};

/** Falls back to the raw key rather than an empty string — a missing label should be visible, not blank. */
export function entityLabel(entity: string): string
{
  return entityLabelsPl[entity] ?? entity;
}

export function entityLabels(entities: readonly string[]): string
{
  return entities.map(entityLabel).join(", ");
}

/** Every entity has a label — asserted by the test, so a new entity cannot ship unnamed. */
export const untranslatedEntities = (): string[] =>
  Object.keys(tagEntityModelMap).filter(entity => !entityLabelsPl[entity]);
