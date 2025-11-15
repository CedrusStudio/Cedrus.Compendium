import { SearchEntityPayload } from "@/common/global/SearchPayloads";
import { HeaderDto } from "@/persistence/schemas/characters/headerSchema";
import { KeysetPagination, OffsetPagination } from "@/common/global/pagination";
import { SearchQueryBuilder } from "@/infrastructure/searchQueries/SearchQueryBuilder";

export function createCharacterSummaryQuery
(
  searchQuery: string | undefined,
  includeTags?: string[],
  pagination?: OffsetPagination | KeysetPagination | undefined
)
  : SearchEntityPayload
{ 
  const builder = SearchQueryBuilder.for("character")
    .searchFilter("name", searchQuery)
    .sort('name', 'asc')
    .pagination(pagination)
    .select({ id: true, name: true, shortName: true, description: true, tags: true });

  if (includeTags && includeTags.length > 0) 
  {
    builder.searchFilter("tags", includeTags);
  }

  return builder.build();
};

export type CharacterSummary = ({id: string} & HeaderDto);