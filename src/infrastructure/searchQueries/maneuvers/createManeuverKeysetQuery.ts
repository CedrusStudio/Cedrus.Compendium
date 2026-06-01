import { DEFAULT_PAGE_SIZE, emptyUlid } from "@/common/global/pagination";
import { SearchEntityPayload } from "@/common/global/SearchPayloads";
import { CastTime } from "@/domain/characters/Castable";
import { SearchQueryBuilder } from "@/infrastructure/searchQueries/SearchQueryBuilder";

export function createManeuverKeysetQuery
(
  searchQuery: string | undefined, 
  cursor: string = emptyUlid,
  includeTags?: string[],
  pageSize: number = DEFAULT_PAGE_SIZE,
  excludeTags?: string[],
  castTimes?: CastTime[],
  grade?: number
)
  : SearchEntityPayload
{ 
  const builder = SearchQueryBuilder.for("maneuver")
    .searchFilter("name", searchQuery)
    .searchFilter("grade", grade)
    .cursorPagination(cursor, pageSize);

  if (includeTags && includeTags.length > 0) 
  {
    builder.searchFilter("tags", includeTags);
  }

  if (excludeTags && excludeTags.length > 0) 
  {
    builder.excludeFilter("tags", excludeTags);
  }

  if (castTimes && castTimes.length > 0)
  {
    builder.searchInFilter("castTime", castTimes);
  }

  return builder.build();
};