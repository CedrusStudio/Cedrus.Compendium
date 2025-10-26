import { SearchEntityPayload } from "@/common/global/SearchPayload";
import { HeaderDto } from "@/persistence/schemas/characters/headerSchema";

export const createCharacterSummaryQuery = (searchQuery: string | undefined): SearchEntityPayload => 
{ 
  return {
    entity: 'character',
    search: { name: searchQuery },
    select: { id: true, name: true, shortName: true, description: true },
    sort: [{ name: 'asc' }],
    pagination: { pageNumber: 1, pageSize: 3 }
  };
};

export type CharacterSummary = ({id: string} & Omit<HeaderDto, 'category'>);