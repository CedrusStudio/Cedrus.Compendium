import { type SearchEntityPayload, type SearchByIdEntityPayload, SearchValueOutputs } from '@/common/global/SearchPayloads';
import { createFiltering, createExcludeFiltering, createMapping, createSorting, collectRequirementFilters, collectTagFacetFilters, Select } from '@/common/global/SearchPayloads';
import { buildTagFacetConditions, toMongoTagConditions, toPrismaTagConditions, type PrismaTagCondition } from '@/domain/tags/tagFacets';
import { loadTagFacetIndexForFiltering } from '@/persistence/tags/tagFacetLayer';
import { createOffsetPagination, createKeysetPagination, isKeysetPagination, isOffsetPagination } from '@/common/global/pagination';
import prisma from '@/lib/prisma';
import { toSpell } from '@/persistence/mappings/spellMappings';
import { buildRequirementSearchPipeline } from '@/persistence/requirementSearchPipeline';
import { characterVisibilityWhere, isCharacterVisible, canUseMineOnlyVisibility, CharacterVisibilityWhere } from '@/persistence/characterVisibility';

const CHARACTER_ENTITY = 'character';

// Mongo aggregateRaw returns the id as `_id`; the app expects `id`.
function normalizeRawDoc(doc: Record<string, unknown>): Record<string, unknown>
{
  const { _id, ...rest } = doc as { _id?: unknown } & Record<string, unknown>;
  return { id: _id, ...rest };
}

//TODO: perform mapping here based on payload.mapping
export async function searchEntityById<TMappedResult>(id: string, payload: SearchByIdEntityPayload, apiKey?: string | null): Promise<TMappedResult[]>
{
  if (payload.entity !== CHARACTER_ENTITY)
  {
    const findByIdInput = createSearchByIdInput(id, payload, payload.include);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return await (prisma[payload.entity as any] as any).findUnique(findByIdInput) as TMappedResult[];
  }

  // Characters can be scoped to specific API keys. Mongo/Prisma `findUnique`
  // cannot combine extra `where` conditions with a unique-key lookup, so we
  // fetch the record, force `apiKeys` into the query for the visibility
  // check, then strip it back out if the caller didn't originally ask for it.
  const apiKeysWasRequested = wasApiKeysFieldRequested(payload);
  const findByIdInput = createSearchByIdInput(id, payload, payload.include);

  if (findByIdInput.select)
  {
    findByIdInput.select = { ...findByIdInput.select, apiKeys: true };
  }

  const result = await prisma.character.findUnique(findByIdInput) as ({ apiKeys?: string[] } & Record<string, unknown>) | null;

  if (!result || !isCharacterVisible(result.apiKeys, apiKey)) return null as unknown as TMappedResult[];

  if (!apiKeysWasRequested) delete result.apiKeys;

  return result as unknown as TMappedResult[];
}

type FindByIdInput =
{
  include?: Record<string, boolean>;
  select?: Select;
  where: { id: string };
};

function createSearchByIdInput(id: string, payload: SearchByIdEntityPayload, includeFallback: Record<string, boolean> = {}): FindByIdInput
{
  const mapping = createMapping(payload, includeFallback);

  return {
    where: { id },
    ...mapping
  };
}

// `select` mode only returns requested fields; `include` mode always returns
// every scalar field (plus the requested relations), so apiKeys is implicitly
// present in that case.
function wasApiKeysFieldRequested(payload: SearchByIdEntityPayload): boolean
{
  if (payload.select) return Boolean(payload.select['apiKeys']);
  return true;
}

export async function searchEntity<TMappedResult>(payload: SearchEntityPayload, apiKey?: string | null): Promise<TMappedResult[]>
{
  // `mineOnly` visibility mode requires an API key. Short-circuit before
  // touching the database instead of letting characterVisibilityWhere throw
  // — the UI already disables this mode without a key, this is the backend
  // defense-in-depth guard for direct/manual API calls.
  if (payload.entity === CHARACTER_ENTITY && payload.characterVisibilityMode === 'mineOnly' && !canUseMineOnlyVisibility(apiKey))
  {
    return [] as TMappedResult[];
  }

  // Wave 5: value-aware requirement filter needs a Mongo `$elemMatch` inside the
  // `structuredRequirements` JSON array, which Prisma's typed `findMany` cannot
  // express — drop to aggregateRaw for this (compendium-only) case. Characters
  // are excluded so their visibility rules are never bypassed.
  // Wave 6.2: several filters may arrive at once (AND); `collectRequirementFilters`
  // folds the singular and plural payload fields into one list.
  const requirementFilters = collectRequirementFilters(payload);

  // Wave 9.3: facet conditions are resolved ONCE, before the execution path is
  // chosen, and rendered for whichever path runs. Building them separately per
  // path is how the two would drift — the reason the renderers share a source.
  const tagFacetConditions = await resolveTagFacetConditions(payload);

  if (requirementFilters.length > 0 && payload.entity !== CHARACTER_ENTITY)
  {
    const pipeline = buildRequirementSearchPipeline({
      search: payload.search,
      exclude: payload.exclude,
      sort: payload.sort,
      offset: isOffsetPagination(payload.pagination) ? payload.pagination : undefined,
      requirementFilters,
      extraConditions: toMongoTagConditions(tagFacetConditions),
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const raw = await (prisma[payload.entity as any] as any).aggregateRaw({ pipeline });
    const normalized = (Array.isArray(raw) ? raw : []).map((doc: Record<string, unknown>) => normalizeRawDoc(doc));

    if (payload.entity === 'spell')
    {
      // `toSpell` expects the concrete SpellModel shape; the aggregateRaw docs are
      // structurally the same rows, just typed loosely after normalization.
      return (normalized as unknown as Parameters<typeof toSpell>[0][]).map(toSpell) as TMappedResult[];
    }

    return normalized as unknown as TMappedResult[];
  }

  const findInput = createSearchInput(payload, apiKey, payload.include, toPrismaTagConditions(tagFacetConditions));
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const results = await (prisma[payload.entity as any] as any).findMany(findInput);

  if (payload.entity === 'spell')
  {
    return results.map(toSpell) as TMappedResult[];
  }

  return results as TMappedResult[];
}

// Type definitions for Prisma where clause structure
type FilterCondition = Record<string, SearchValueOutputs>;
type CursorCondition = { id: { gt: string } };
type NotCondition = { NOT: FilterCondition };
type AndConditionMember = FilterCondition | NotCondition | CursorCondition | CharacterVisibilityWhere | PrismaTagCondition;
type AndCondition = { AND: Array<AndConditionMember> };
type PrismaWhereClause = FilterCondition | AndCondition | NotCondition | CursorCondition | CharacterVisibilityWhere | PrismaTagCondition | undefined;

// Type guards for narrowing
function isAndCondition(where: PrismaWhereClause): where is AndCondition 
{
  return where !== undefined && typeof where === 'object' && 'AND' in where && Array.isArray(where.AND);
}

type FindInput = 
{
  include?: Record<string, boolean>;
  select?: Select;
  where: PrismaWhereClause;
  orderBy?: { [key: string]: "asc" | "desc" }[];
  take?: number;
  skip?: number;
};

function createSearchInput(payload: SearchEntityPayload, apiKey: string | null | undefined, includeFallback: Record<string, boolean> = {}, tagFacetConditions: PrismaTagCondition[] = []): FindInput
{
  const includeFilters = createFiltering(payload);
  const excludeFilters = createExcludeFiltering(payload);
  const sorting = createSorting(payload);
  const mapping = createMapping(payload, includeFallback);

  // Build where clause with proper Prisma NOT syntax. Every active condition
  // (user filters, exclude filters, character-visibility) is collected and
  // combined with AND — this keeps visibility enforced at the database level
  // instead of post-filtering results in application code.
  const conditions: Array<AndConditionMember> = [];

  if (includeFilters) conditions.push(includeFilters);
  if (excludeFilters) conditions.push({ NOT: excludeFilters });
  if (payload.entity === CHARACTER_ENTITY) conditions.push(characterVisibilityWhere(apiKey, payload.characterVisibilityMode ?? 'all'));
  conditions.push(...tagFacetConditions);

  let whereClause: PrismaWhereClause;

  if (conditions.length > 1)
  {
    whereClause = { AND: conditions };
  }
  else if (conditions.length === 1)
  {
    whereClause = conditions[0];
  }
  else
  {
    whereClause = undefined;
  }

  let findInput: FindInput = {
    where: whereClause,
    orderBy: sorting,
    ...mapping
  };
  
  if (isOffsetPagination(payload.pagination)) 
  {
    findInput = { 
      ...findInput,
      ...createOffsetPagination(payload.pagination)
    };
  }   

  if (isKeysetPagination(payload.pagination)) 
  {
    const { where: cursorWhere, take } = createKeysetPagination(payload.pagination);

    // Merge cursor condition with existing where clause
    if (isAndCondition(whereClause)) 
    {
      // Already using AND - append cursor condition
      findInput = { 
        ...findInput,
        where: { AND: [...whereClause.AND, cursorWhere] },
        take
      };
    } else if (whereClause) 
    {
      // Single condition or NOT - wrap in AND with cursor
      findInput = { 
        ...findInput,
        where: { AND: [whereClause, cursorWhere] },
        take
      };
    } else 
    {
      // No filters - just cursor
      findInput = { 
        ...findInput,
        where: cursorWhere,
        take
      };
    }
  }

  return findInput;
}
/**
 * Resolves the payload's facet filters against the facet layer.
 *
 * Returns nothing when the payload carries no facet filter, so a query written
 * before Wave 9 never pays for loading the layer — and never changes shape.
 */
async function resolveTagFacetConditions(payload: SearchEntityPayload)
{
  const filters = collectTagFacetFilters(payload);
  if (filters.length === 0) return [];

  const index = await loadTagFacetIndexForFiltering(payload.entity);
  return buildTagFacetConditions(filters, index);
}
