import { DEFAULT_PAGE_SIZE } from "@/common/global/pagination";
import { SearchEntityPayload } from "@/common/global/SearchPayloads";
import { SearchQueryBuilder } from "@/infrastructure/searchQueries/SearchQueryBuilder";

export function createStanceOffsetQuery
(
  searchQuery: string | undefined, 
  pageNumber: number = 1,
  includeTags?: string[],
  pageSize: number = DEFAULT_PAGE_SIZE,
  excludeTags?: string[]
)
  : SearchEntityPayload
{ 
  const builder = SearchQueryBuilder.for("stance")
    .searchFilter("name", searchQuery)
    .offsetPagination(pageNumber, pageSize)
    .sort("name", "asc")
    .sort("grade", "asc")
    .sort("id", "asc");

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
