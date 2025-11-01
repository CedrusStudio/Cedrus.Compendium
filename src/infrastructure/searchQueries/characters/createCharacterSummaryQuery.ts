import { SearchEntityPayload } from "@/common/global/SearchPayloads";
import { HeaderDto } from "@/persistence/schemas/characters/headerSchema";
import { DEFAULT_PAGE_SIZE, KeysetPagination, OffsetPagination } from "@/common/global/pagination";

export const createCharacterSummaryQuery = (searchQuery: string | undefined, pagination?: OffsetPagination | KeysetPagination | undefined): SearchEntityPayload => 
{ 
  return {
    entity: 'character',
    search: { name: searchQuery },
    select: { id: true, name: true, shortName: true, description: true },
    sort: [{ name: 'asc' }],
    pagination: pagination || { pageNumber: 1, pageSize: DEFAULT_PAGE_SIZE }
  };
};

export type CharacterSummary = ({id: string} & Omit<HeaderDto, 'category'>);