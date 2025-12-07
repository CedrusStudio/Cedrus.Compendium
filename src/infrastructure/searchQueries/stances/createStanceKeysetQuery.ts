import { DEFAULT_PAGE_SIZE, emptyUlid } from "@/common/global/pagination";
import { SearchEntityPayload } from "@/common/global/SearchPayloads";
import { SearchQueryBuilder } from "@/infrastructure/searchQueries/SearchQueryBuilder";

export function createStanceKeysetQuery
(
  searchQuery: string | undefined, 
  cursor: string = emptyUlid,
  includeTags?: string[],
  pageSize: number = DEFAULT_PAGE_SIZE,
  excludeTags?: string[]
)
  : SearchEntityPayload
{ 
  const builder = SearchQueryBuilder.for("stance")
    .searchFilter("name", searchQuery)
    .cursorPagination(cursor, pageSize)
    .sort("name", "asc")
    .sort("grade", "asc");

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