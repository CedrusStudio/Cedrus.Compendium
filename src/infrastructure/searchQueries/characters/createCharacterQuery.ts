import { SearchEntityPayload } from "@/common/global/SearchPayload";

export const includeAllRelations =
{
  stances: true,
  states: true,
  maneuvers: true,
  spells: true,
  perks: true
};

export const createCharacterQuery = (searchQuery?: string | undefined): SearchEntityPayload => 
{ 
  return {
    entity: 'character',
    search: searchQuery ? { name: searchQuery } : undefined,
    include: includeAllRelations,
    sort: [{ name: 'asc' }],
    pagination: { pageNumber: 1, pageSize: 3 }
  };
};
