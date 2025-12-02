import { DEFAULT_PAGE_SIZE, emptyUlid } from "@/common/global/pagination";
import { SearchEntityPayload } from "@/common/global/SearchPayloads";
import { SearchQueryBuilder } from "@/infrastructure/searchQueries/SearchQueryBuilder";
import { Style } from "@/domain/characters/equipment/Weapon";

export function createWeaponKeysetQuery
(
  searchQuery: string | undefined, 
  cursor: string = emptyUlid,
  includeTags?: string[],
  pageSize: number = DEFAULT_PAGE_SIZE,
  excludeTags?: string[],
  style?: Style | "All"
)
  : SearchEntityPayload
{ 
  const builder = SearchQueryBuilder.for("weapon")
    .searchFilter("name", searchQuery)
    .cursorPagination(cursor, pageSize);

  if (includeTags && includeTags.length > 0) 
  {
    builder.searchFilter("tags", includeTags);
  }

  if (style && style !== "All") 
  {
    builder.searchFilter("style", style);
  }

  if (excludeTags && excludeTags.length > 0) 
  {
    builder.excludeFilter("tags", excludeTags);
  }

  return builder.build();
};
