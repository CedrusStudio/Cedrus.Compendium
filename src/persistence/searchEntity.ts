import { type SearchEntityPayload, type SearchByIdEntityPayload, SearchValueOutputs } from '@/common/global/SearchPayloads';
import { createFiltering, createExcludeFiltering, createMapping, createSorting, SearchPayload, Select } from '@/common/global/SearchPayloads';
import { createOffsetPagination, createKeysetPagination, isKeysetPagination, isOffsetPagination } from '@/common/global/pagination';
import prisma from '@/lib/prisma';
import { toSpell } from '@/persistence/mappings/spellMappings';

//TODO: perform mapping here based on payload.mapping
export async function searchEntityById<TMappedResult>(id: string, payload: SearchByIdEntityPayload): Promise<TMappedResult[]>
{
  const findByIdInput = createSearchByIdInput(id, payload, payload.include);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return await (prisma[payload.entity as any] as any).findUnique(findByIdInput) as TMappedResult[];
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

export async function searchEntity<TMappedResult>(payload: SearchEntityPayload): Promise<TMappedResult[]>
{
  const findInput = createSearchInput(payload, payload.include);
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
type AndCondition = { AND: Array<FilterCondition | NotCondition | CursorCondition> };
type PrismaWhereClause = FilterCondition | AndCondition | NotCondition | CursorCondition | undefined;

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

function createSearchInput(payload: SearchPayload, includeFallback: Record<string, boolean> = {}): FindInput
{
  const includeFilters = createFiltering(payload);
  const excludeFilters = createExcludeFiltering(payload);
  const sorting = createSorting(payload);
  const mapping = createMapping(payload, includeFallback);
  
  // Build where clause with proper Prisma NOT syntax
  let whereClause: PrismaWhereClause;
  
  if (includeFilters && excludeFilters) 
  {
    // Both include and exclude filters - use AND with NOT wrapper
    const andConditions: Array<FilterCondition | NotCondition> = 
    [
      includeFilters,
      { NOT: excludeFilters }
    ];
    whereClause = { AND: andConditions };
  } 
  else if (includeFilters) 
  {
    whereClause = includeFilters;
  } 
  else if (excludeFilters) 
  {
    whereClause = { NOT: excludeFilters };
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