import { searchParamKey } from "@/common/global/httpUtils";

const characterKey = 'characters';

export const createSearchCharactersKey = (search: string) => [characterKey, searchParamKey, search] as const;
export const allCharactersKey = [characterKey, 'all'] as const;
export const createCharacterByIdKey = (id: string) => [characterKey, id] as const;

export const getCharacterQueryKey = (search: string | undefined) => search 
    ? createSearchCharactersKey(search)
    : allCharactersKey;