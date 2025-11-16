import { SearchEntityPayload } from "@/common/global/SearchPayloads";
import { includeAllRelations } from "@/infrastructure/searchQueries/characters/allCharacterRelations";
import { DEFAULT_PAGE_SIZE, emptyUlid } from "@/common/global/pagination";
import { SearchQueryBuilder } from "@/infrastructure/searchQueries/SearchQueryBuilder";

export function createCharacterQuery
(
  searchQuery?: string | undefined, 
  cursor: string = emptyUlid,
  includeTags?: string[],
  pageSize: number = DEFAULT_PAGE_SIZE
)
  : SearchEntityPayload
{ 
  const builder = SearchQueryBuilder.for("character")
    .searchFilter("name", searchQuery)
    .sort('name', 'asc')
    .cursorPagination(cursor, pageSize)
    .include(includeAllRelations);

  if (includeTags && includeTags.length > 0) 
  {
    builder.searchFilter("tags", includeTags);
  }

  return builder.build(); 
};
