/**
 * Reverse lookup ("Posiadane przez postacie"): maps a compendium entity kind to
 * the scalar id-array field on the Character that references it. Shared by the
 * API route (Prisma `where`) and the client so both agree on the vocabulary.
 */

export const OWNING_ENTITY_ID_FIELDS = {
  maneuvers: "maneuversIds",
  stances: "stancesIds",
  states: "statesIds",
  perks: "perksIds",
  spells: "spellsIds",
  powerSpecifications: "powerSpecificationsIds",
  weapons: "weaponsIds",
  armors: "armorsIds",
  shields: "shieldsIds",
  inventory: "inventoryIds",
  mounts: "mountsIds",
} as const;

export type OwningEntity = keyof typeof OWNING_ENTITY_ID_FIELDS;

export type OwningCharacter =
{
  id: string;
  name: string;
  shortName: string;
};

export function isOwningEntity(value: string): value is OwningEntity
{
  return Object.prototype.hasOwnProperty.call(OWNING_ENTITY_ID_FIELDS, value);
}
