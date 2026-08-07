import { OffsetPagination, KeysetPagination, isKeysetPagination } from "@/common/global/pagination";
import type { RequirementTargetGroup } from "@/domain/requirements/Requirement";
import type { TagFacetFilter } from "@/domain/tags/tagFacets";
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

export type { TagFacetFilter };

/** Drops facet filters that would narrow nothing (no values and no "— brak —"). */
export function isUsableTagFacetFilter(filter: TagFacetFilter | undefined | null): filter is TagFacetFilter
{
  if (!filter || !filter.facetKey.trim()) return false;
  return filter.tags.length > 0 || filter.includeNone === true;
}

export function collectTagFacetFilters(payload: SearchPayload): TagFacetFilter[]
{
  return (payload.tagFacetFilters ?? []).filter(isUsableTagFacetFilter);
}

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

export type CharacterVisibilityMode = 'all' | 'mineOnly' | 'publicOnly';

/**
 * Wave 5 compendium requirement filter. Two modes:
 *  - `ranked`: keep entities that have a `ranked` structured requirement for
 *    `group`/`targetKey` whose value is `<= maxValue` ("what a character at this
 *    rank already satisfies").
 *  - `text`: keep entities whose free-text `requirements` contain `text`
 *    (case-insensitive substring) — for unstructured requirements like
 *    "Lekka zbroja" that were never mapped to a ranked target.
 *
 * Handled by a dedicated Mongo aggregateRaw path in `searchEntity` (Prisma's
 * typed API cannot elem-match inside the `structuredRequirements` JSON array).
 */
export type RankedRequirementSearchFilter =
{
  kind: 'ranked';
  group: RequirementTargetGroup;
  targetKey: string;
  maxValue: number;
};

export type TextRequirementSearchFilter =
{
  kind: 'text';
  text: string;
};

export type RequirementSearchFilter = RankedRequirementSearchFilter | TextRequirementSearchFilter;

export type SearchPayload =
{
  search?: { [key: string]: SearchValueInput };
  exclude?: { [key: string]: SearchValueInput };
  sort?: { [key: string]: 'asc' | 'desc' }[] | undefined;
  pagination?: OffsetPagination | KeysetPagination;
  select?: Select;
  // Applies only to entity === 'character'; ignored for every other entity.
  characterVisibilityMode?: CharacterVisibilityMode;
  // Applies only to compendium entities with structured requirements.
  // Single-filter form kept for compatibility with callers (and stored queries)
  // written before Wave 6.2; `requirementFilters` is the canonical field.
  requirementFilter?: RequirementSearchFilter;
  // Wave 6.2: several requirement filters at once, combined with AND — an entity
  // must satisfy every one of them.
  requirementFilters?: RequirementSearchFilter[];
  // Wave 9.3: faceted tag filtering. OR inside a facet, AND between facets, plus
  // a synthetic "no tag from this facet" value. Additive — `search.tags` and
  // `exclude.tags` keep working unchanged and AND together with these, so every
  // payload written before Wave 9 produces exactly the same query.
  //
  // Values are CANONICAL tags; the server expands them to the spellings valid
  // for the entity (`nieumarli` also matches `nieumarły` on a Character). The
  // client never sends spellings — otherwise adding an alias in the admin panel
  // would require reloading every open view.
  tagFacetFilters?: TagFacetFilter[];
};

/** Drops filters that carry no usable value (blank text / missing target). */
export function isUsableRequirementFilter(filter: RequirementSearchFilter | undefined | null): filter is RequirementSearchFilter
{
  if (!filter) return false;
  if (filter.kind === 'text') return filter.text.trim() !== '';
  return filter.targetKey.trim() !== '' && Number.isFinite(filter.maxValue);
}

/**
 * Normalizes the singular and plural requirement-filter fields into one AND-ed
 * list. Both shapes are accepted so a payload built before Wave 6.2 keeps
 * working; the result is what every consumer (`searchEntity`, the pipeline
 * builder) actually reasons about.
 */
export function collectRequirementFilters(payload: SearchPayload): RequirementSearchFilter[]
{
  return [...(payload.requirementFilters ?? []), ...(payload.requirementFilter ? [payload.requirementFilter] : [])]
    .filter(isUsableRequirementFilter);
}

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