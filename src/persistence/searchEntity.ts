import { type SearchEntityPayload, type SearchByIdEntityPayload, SearchValueOutputs } from '@/common/global/SearchPayloads';
import { createFiltering, createMapping, createSorting, SearchPayload, Select } from '@/common/global/SearchPayloads';
import { createOffsetPagination, createKeysetPagination, isKeysetPagination, isOffsetPagination } from '@/common/global/pagination';
import prisma from '@/lib/prisma';

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
  return await (prisma[payload.entity as any] as any).findMany(findInput) as TMappedResult[];
}

type FindInput = 
{
  include?: Record<string, boolean>;
  select?: Select;
  where: Record<string, SearchValueOutputs> | { id: { gt: string; }; } | undefined;
  orderBy?: { [key: string]: "asc" | "desc" }[];
  take?: number;
  skip?: number;
};

function createSearchInput(payload: SearchPayload, includeFallback: Record<string, boolean> = {}): FindInput
{
  const filters = createFiltering(payload);
  const sorting = createSorting(payload);
  const mapping = createMapping(payload, includeFallback);
  
  let findInput: FindInput = {
    where: filters,
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
    const { where, take } = createKeysetPagination(payload.pagination);

    findInput = { 
      ...findInput,
      where: { ...findInput.where, ...where },
      take
    };
  }

  return findInput;
}