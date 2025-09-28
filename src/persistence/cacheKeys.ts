import { searchParamKey } from "@/utils/global/httpUtils";

export const createSearchCharactersKey = (search: string) => ['characters', searchParamKey, search] as const;
export const allCharactersKey = ['characters', 'all'] as const;
export const createCharacterByIdKey = (id: string) => ['characters', id] as const;

export const getCharacterQueryKey = (search: string | undefined) => search 
    ? createSearchCharactersKey(search)
    : allCharactersKey;