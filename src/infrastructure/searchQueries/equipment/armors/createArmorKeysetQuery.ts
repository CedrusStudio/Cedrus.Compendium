import { DEFAULT_PAGE_SIZE, emptyUlid } from "@/common/global/pagination";
import { SearchEntityPayload } from "@/common/global/SearchPayloads";
import { SearchQueryBuilder } from "@/infrastructure/searchQueries/SearchQueryBuilder";

export function createArmorKeysetQuery
(
  searchQuery: string | undefined, 
  cursor: string = emptyUlid,
  pageSize: number = DEFAULT_PAGE_SIZE
)
  : SearchEntityPayload
{ 
  return SearchQueryBuilder.for("armor")
    .searchFilter("name", searchQuery)
    .cursorPagination(cursor, pageSize)
    .build();
};
