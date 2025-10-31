import { SearchEntityPayload } from "@/common/global/SearchPayloads";
import { includeAllRelations } from "@/infrastructure/searchQueries/characters/allCharacterRelations";

export const createCharacterQuery = (searchQuery?: string | undefined): SearchEntityPayload => 
{ 
  return {
    entity: 'character',
    search: searchQuery ? { name: searchQuery } : undefined,
    include: includeAllRelations,
    sort: [{ name: 'asc' }],
    pagination: { pageNumber: 1, pageSize: 3 }
  };
};
