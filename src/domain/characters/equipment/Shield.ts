import { DefensiveItem } from "@/domain/characters/equipment/Item";
import { ulid } from "ulid";

export type Shield = DefensiveItem & 
{
  block: number;
};

export const allowedBlocks = 
[ 
  0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10,
  11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 
  21, 22, 23, 24, 25, 26, 27, 28, 29, 30,
  31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 
  41, 42, 43, 44, 45, 46, 47, 48, 49, 50
] as const satisfies readonly number[];

export const defaultShield: Omit<Shield, "id"> =
{
  name: "Nowa tarcza",
  description: "Opis tarczy",
  block: 0,
  resistance: 0,
  dexterityRestriction: 0,
  reflexRestriction: 0,
  initiativeRestriction: 0,
  attributePenalty: 0,
  strengthRequirement: 0,
};

export const CreateDefaultShield = (): Shield => ({...defaultShield, id: ulid()});