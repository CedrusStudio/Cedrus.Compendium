import { Entity } from "@/domain/Entity";
import { Tag } from "@/domain/Tag";
import { ulid } from "ulid";

export type Item = Entity & 
{
  description: string;
  tags: Tag[];
};

export type DefensiveItem = Item &
{
  resistance: number;
  dexterityRestriction: number;
  reflexRestriction: number;
  initiativeRestriction: number;
  attributePenalty: number;
  strengthRequirement: number;
};

export const allowedResistances = 
[ 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10,
  11, 12, 13, 14, 15, 16, 17, 18, 19, 20,
  21, 22, 23, 24, 25, 26, 27, 28, 29, 30,
  31, 32, 33, 34, 35, 36, 37, 38, 39, 40,
  41, 42, 43, 44, 45, 46, 47, 48, 49, 50
] as const satisfies readonly number[];

export const allowedItemAttributePenalties = [ -10, -9, -8, -7, -6, -5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20 ] as const satisfies readonly number[];
export const allowedDexterityRestrictions = [ -10, -9, -8, -7, -6, -5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20 ] as const satisfies readonly number[];
export const allowedReflexRestrictions = [ -10, -9, -8, -7, -6, -5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20 ] as const satisfies readonly number[];
export const allowedInitiativeRestrictions = [ -10, -9, -8, -7, -6, -5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20 ] as const satisfies readonly number[];
export const allowedStrengthRequirements = [ -10, -9, -8, -7, -6, -5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20 ] as const satisfies readonly number[];

export const defaultInventoryItem: Omit<Item, "id"> =
{
  name: "Nowy przedmiot",
  description: "Opis przedmiotu",
  tags: []
};

export const CreateDefaultInventoryItem = (): Item => ({...defaultInventoryItem, id: ulid()});