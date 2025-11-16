import { DEFAULT_PAGE_SIZE, emptyUlid } from "@/common/global/pagination";
import { SearchEntityPayload } from "@/common/global/SearchPayloads";
import { SearchQueryBuilder } from "@/infrastructure/searchQueries/SearchQueryBuilder";

export function createShieldKeysetQuery
(
  searchQuery: string | undefined, 
  cursor: string = emptyUlid,
  pageSize: number = DEFAULT_PAGE_SIZE,
  includeTags?: string[]
)
  : SearchEntityPayload
{ 
  const builder = SearchQueryBuilder.for("shield")
    .searchFilter("name", searchQuery)
    .cursorPagination(cursor, pageSize);

  if (includeTags && includeTags.length > 0) 
  {
    builder.searchFilter("tags", includeTags);
  }

  return builder.build();
};
