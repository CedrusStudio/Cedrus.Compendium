import { SearchEntityPayload } from "@/common/global/SearchPayloads";
import { includeAllRelations } from "@/infrastructure/searchQueries/characters/allCharacterRelations";
import { KeysetPagination, OffsetPagination } from "@/common/global/pagination";
import { SearchQueryBuilder } from "@/infrastructure/searchQueries/SearchQueryBuilder";

export function createCharacterQuery
(
  searchQuery?: string | undefined, 
  pagination?: OffsetPagination | KeysetPagination | undefined
)
  : SearchEntityPayload
{ 
  return SearchQueryBuilder.for("character")
    .searchFilter("name", searchQuery)
    .sort('name', 'asc')
    .pagination(pagination)
    .include(includeAllRelations)
    .build(); 
};
