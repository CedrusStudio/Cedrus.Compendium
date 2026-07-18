import { CharacterVisibilityMode, SearchEntityPayload } from "@/common/global/SearchPayloads";
import { includeAllRelations } from "@/infrastructure/searchQueries/characters/allCharacterRelations";
import { DEFAULT_PAGE_SIZE, emptyUlid } from "@/common/global/pagination";
import { SearchQueryBuilder } from "@/infrastructure/searchQueries/SearchQueryBuilder";

export function createCharacterQuery
(
  searchQuery?: string | undefined,
  cursor: string = emptyUlid,
  includeTags?: string[],
  pageSize: number = DEFAULT_PAGE_SIZE,
  excludeTags?: string[],
  visibilityMode?: CharacterVisibilityMode
)
  : SearchEntityPayload
{
  const builder = SearchQueryBuilder.for("character")
    .searchFilter("name", searchQuery)
    .sort('name', 'asc')
    .cursorPagination(cursor, pageSize)
    .visibilityFilter(visibilityMode)
    .include(includeAllRelations);

  if (includeTags && includeTags.length > 0) 
  {
    builder.searchFilter("tags", includeTags);
  }
  
  if (excludeTags && excludeTags.length > 0) 
  {
    builder.excludeFilter("tags", excludeTags);
  }

  return builder.build(); 
};
