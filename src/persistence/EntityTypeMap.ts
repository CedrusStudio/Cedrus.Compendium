import { Character } from "@/domain/characters/Character";
import { Maneuver } from "@/domain/characters/combat/Maneuver";
import { Spell } from "@/domain/characters/combat/Power";

// Define the type-to-entity-name mapping
// export type EntityTypeMap = 
// {
//   [K in keyof typeof EntityTypes]: typeof EntityTypes[K];
// };

// export const EntityTypes = 
// {
//   Character: 'character',
//   Maneuver: 'maneuver',
//   Perk: 'perk',
//   Stance: 'stance',
//   State: 'state',
//   Weapon: 'weapon',
//   Armor: 'armor',
//   Shield: 'shield',
//   Mount: 'mount',
//   InventoryItem: 'inventoryItem',
//   Spell: 'spell',
// } as const;

// Type helper to get entity name from type
export type EntityName<T> = 
  T extends Character ? 'character' :
  T extends Maneuver ? 'maneuver' :
  T extends Spell ? 'spell' :
  never;
