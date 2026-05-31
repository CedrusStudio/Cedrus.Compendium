import { OffsetPagination, KeysetPagination, isKeysetPagination } from "@/common/global/pagination";
import { Character } from "@/domain/characters/Character";
import { Maneuver } from "@/domain/characters/combat/Maneuver";
import { Mode } from "@/domain/characters/combat/Mode";
import { PowerSpecification, Spell } from "@/domain/characters/combat/Power";
import { Perk } from "@/domain/characters/Perk";
import { Weapon } from "@/domain/characters/equipment/Weapon";
import { Armor } from "@/domain/characters/equipment/Armor";
import { Shield } from "@/domain/characters/equipment/Shield";
import { Item } from "@/domain/characters/equipment/Item";
import { Mount } from "@/domain/characters/equipment/Mount";
import { Race } from "@/domain/Race";

export function isAllowedSearchEntity(entity: string): boolean
{
  return allowedSearchEntities.includes(entity as typeof allowedSearchEntities[number]);
}

const allowedSearchEntities = ['character', 'maneuver', 'spell', 'perk', 'race', 'stance', 'state', 'weapon', 'armor', 'shield', 'inventoryItem', 'mount', 'powerSpecification'] as const satisfies readonly string[];
export type EntityName = typeof allowedSearchEntities[number];
export type EntityTypeMap = 
{
  'character': Character;
  'maneuver': Maneuver;
  'spell': Spell;
  'perk': Perk;
  'race': Race;
  'stance': Mode;
  'state': Mode;
  'weapon': Weapon;
  'armor': Armor;
  'shield': Shield;
  'inventoryItem': Item;
  'mount': Mount;
  'powerSpecification': PowerSpecification;
};

export type SearchEntityPayload =
  | (SearchPayload & { entity: string; include: Record<string, boolean>; select?: undefined })
  | (SearchPayload & { entity: string; select: Select; include?: undefined })
  | (SearchPayload & { entity: string; include?: undefined; select?: undefined });

export type SearchPayload = 
{
  search?: { [key: string]: SearchValueInput };
  exclude?: { [key: string]: SearchValueInput };
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

export type SearchScalarValueInput = string | number | boolean;
export type SearchAnyOfInput = { anyOf: SearchScalarValueInput[] };
export type SearchValueInput = SearchScalarValueInput | string[] | SearchAnyOfInput | undefined;
export type SearchValueOutputs =
  | { contains: string; mode: "insensitive" }
  | { equals: number | boolean }
  | { hasEvery: string[] }
  | { hasSome: string[] }
  | { in: SearchScalarValueInput[] };

export function anyOfValues(values: SearchScalarValueInput[]): SearchAnyOfInput
{
  return { anyOf: values };
}

function isSearchAnyOfInput(value: SearchValueInput): value is SearchAnyOfInput
{
  return typeof value === 'object' && value !== null && 'anyOf' in value && Array.isArray(value.anyOf);
}

function hasSearchValue(value: SearchValueInput): boolean
{
  if (value === undefined || value === null) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  if (isSearchAnyOfInput(value)) return value.anyOf.length > 0;
  return true;
}

export function searchValuesMapping(value: SearchValueInput, isExclude = false): SearchValueOutputs
{
  if (isSearchAnyOfInput(value)) return { in: value.anyOf };
  if (typeof value === 'string') return { contains: value, mode: "insensitive" };
  if (typeof value === 'number') return { equals: value };
  if (typeof value === 'boolean') return { equals: value };
  if (Array.isArray(value)) {
    // For exclude, we use hasSome which will be wrapped in NOT at a higher level
    if (isExclude) {
      return { hasSome: value };
    }
    return { hasEvery: value };
  }
  throw new Error('Unsupported search value type');
}

export function createFiltering(payload: SearchPayload): Record<string, SearchValueOutputs> | undefined
{
  if (!payload.search) return undefined;
  
  const filters = Object.entries(payload.search)
    .filter(([, value]) => hasSearchValue(value))
    .reduce((acc, [key, value]) => ({ ...acc, [key]: searchValuesMapping(value, false) }), {});
  
  return Object.keys(filters).length > 0 ? filters : undefined;
}

export function createExcludeFiltering(payload: SearchPayload): Record<string, SearchValueOutputs> | undefined
{
  if (!payload.exclude) return undefined;
  
  const filters = Object.entries(payload.exclude)
    .filter(([, value]) => hasSearchValue(value))
    .reduce((acc, [key, value]) => ({ ...acc, [key]: searchValuesMapping(value, true) }), {});
  
  return Object.keys(filters).length > 0 ? filters : undefined;
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