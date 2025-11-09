import { OffsetPagination, KeysetPagination, isKeysetPagination } from "@/common/global/pagination";
import { Character } from "@/domain/characters/Character";
import { Maneuver } from "@/domain/characters/combat/Maneuver";
import { Mode } from "@/domain/characters/combat/Mode";
import { Spell } from "@/domain/characters/combat/Power";
import { Perk } from "@/domain/characters/Perk";
import { Weapon } from "@/domain/characters/equipment/Weapon";
import { Armor } from "@/domain/characters/equipment/Armor";
import { Shield } from "@/domain/characters/equipment/Shield";
import { Item } from "@/domain/characters/equipment/Item";
import { Mount } from "@/domain/characters/equipment/Mount";

export function isAllowedSearchEntity(entity: string): boolean
{
  return allowedSearchEntities.includes(entity as typeof allowedSearchEntities[number]);
}

const allowedSearchEntities = ['character', 'maneuver', 'spell', 'perk', 'stance', 'state', 'weapon', 'armor', 'shield', 'inventoryItem', 'mount'] as const satisfies readonly string[];
export type EntityName = typeof allowedSearchEntities[number];
export type EntityTypeMap = 
{
  'character': Character;
  'maneuver': Maneuver;
  'spell': Spell;
  'perk': Perk;
  'stance': Mode;
  'state': Mode;
  'weapon': Weapon;
  'armor': Armor;
  'shield': Shield;
  'inventoryItem': Item;
  'mount': Mount;
};

export type SearchEntityPayload =
  | (SearchPayload & { entity: string; include: Record<string, boolean>; select?: undefined })
  | (SearchPayload & { entity: string; select: Select; include?: undefined })
  | (SearchPayload & { entity: string; include?: undefined; select?: undefined });

export type SearchPayload = 
{
  search?: { [key: string]: SearchValueInput };
  sort?: { [key: string]: 'asc' | 'desc' }[] | undefined;
  pagination?: OffsetPagination | KeysetPagination;
  select?: Select;
};

export type SearchByIdEntityPayload =
  | (SearchByIdPayload & { entity: string; include: Record<string, boolean>; select?: undefined })
  | (SearchByIdPayload & { entity: string; select: Select; include?: undefined })
  | (SearchByIdPayload & { entity: string; include?: undefined; select?: undefined });

export type SearchByIdPayload = 
{
  select?: Select;
};

export type Select = { [key: string]: boolean | Select };

export type SearchValueInput = string | number | boolean | string[] | undefined;
export type SearchValueOutputs =
  | { contains: string; mode: "insensitive" }
  | { equals: number | boolean }
  | { hasSome: string[] };

export function searchValuesMapping(value: SearchValueInput): SearchValueOutputs
{
  if (typeof value === 'string') return { contains: value, mode: "insensitive" };
  if (typeof value === 'number') return { equals: value };
  if (typeof value === 'boolean') return { equals: value };
  if (Array.isArray(value)) return { hasSome: value };
  throw new Error('Unsupported search value type');
}

export function createFiltering(payload: SearchPayload): Record<string, SearchValueOutputs> | undefined
{
  if (!payload.search) return undefined;
  
  const filters = Object.entries(payload.search)
    .filter(([, value]) => !!value)
    .map(([key, value]) => [key, searchValuesMapping(value)]);

  return Object.fromEntries(filters);
}

export function createMapping(payload: { select?: Select }, includeFallback: Record<string, boolean> = {})
{
  if (!payload.select) return { include: includeFallback};
  return { select: createMappingRecursive(payload.select) };
}

function createMappingRecursive(select: Select)
{
  const mapping: Select = {};

  for (const [key, value] of Object.entries(select))
  {
    if (typeof value === 'object')
    {
      mapping[key] = { select: createMappingRecursive(value) };
    }
    
    mapping[key] = value;
  }
  
  return mapping;
}

export function createSorting(payload: SearchPayload)
{
  if (!payload.sort) return undefined;
  if (isKeysetPagination(payload.pagination))
  {
    return [ { id: 'asc' }, ...payload.sort ] as const satisfies { [key: string]: 'asc' | 'desc' }[];
  }
  return payload.sort;
}