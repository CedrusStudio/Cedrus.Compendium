type CharacterSummaryQuery = 
{ 
  search: { name: string | undefined };
  select: { id: boolean; name: boolean; shortName: boolean; description: boolean };
  sort: { name: 'asc' | 'desc' }[];
  pagination: { pageNumber: number; pageSize: number };
};

export const createCharacterSummaryQuery = (searchQuery: string | undefined): CharacterSummaryQuery => 
{ 
  return {
    search: { name: searchQuery },
    select: { id: true, name: true, shortName: true, description: true },
    sort: [{ name: 'asc' }],
    pagination: { pageNumber: 1, pageSize: 3 }
  };
};
