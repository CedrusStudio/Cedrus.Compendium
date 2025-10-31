import { SearchEntityPayload } from "@/common/global/SearchPayloads";

export const createManeuverQuery = (searchQuery?: string | undefined): SearchEntityPayload => 
{ 
  return {
    entity: 'maneuver',
    search: { name: searchQuery },
    sort: [{ name: 'asc' }],
    pagination: { pageNumber: 1, pageSize: 3 }
  };
};
