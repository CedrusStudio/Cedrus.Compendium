import { OffsetPagination, KeysetPagination } from "@/common/global/pagination";

export type SearchPayload = 
{
  search?: { [key: string]: string | number | boolean | undefined };
  sort?: { [key: string]: 'asc' | 'desc' }[] | undefined;
  pagination?: OffsetPagination | KeysetPagination;
  select: Select;
};

export type Select = { [key: string]: boolean | Select };

export function createFiltering(payload: SearchPayload)
{
  if (!payload.search) return null;
  
  const filters = Object.entries(payload.search)
    .filter(([, value]) => !!value)
    .map(([key, value]) => [key, { contains: value, mode: "insensitive" }]);
      
  return Object.fromEntries(filters);
}

export function createMapping(payload: SearchPayload, includeFallback: Record<string, boolean> = {})
{
  if (!payload.select) return { include: includeFallback};
  return { select: createMappingRecursive(payload.select) };
}

export function createMappingRecursive(select: Select)
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
  return payload.sort;
}