import { SearchEntityPayload } from "@/common/global/SearchPayloads";
import { includeAllRelations } from "@/infrastructure/searchQueries/characters/allCharacterRelations";
import { DEFAULT_PAGE_SIZE, KeysetPagination, OffsetPagination } from "@/common/global/pagination";

export const createCharacterQuery = (searchQuery?: string | undefined, pagination?: OffsetPagination | KeysetPagination | undefined): SearchEntityPayload => 
{ 
  return {
    entity: 'character',
    search: searchQuery ? { name: searchQuery } : undefined,
    include: includeAllRelations,
    sort: [{ name: 'asc' }],
    pagination: pagination || { pageNumber: 1, pageSize: DEFAULT_PAGE_SIZE }
  };
};
