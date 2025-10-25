import { searchParamKey } from "@/common/global/httpUtils";

const characterKey = 'characters';

export const createSearchCharactersKey = (search: string) => [characterKey, searchParamKey, search] as const;
export const allCharactersKey = [characterKey, 'all'] as const;
export const createCharacterByIdKey = (id: string) => [characterKey, id] as const;

export const getCharacterQueryKey = (search: string | undefined) => search 
    ? createSearchCharactersKey(search)
    : allCharactersKey;

const maneuverKey = 'maneuvers';
export const createSearchManeuversKey = (search: string, sort: string) => [maneuverKey, searchParamKey, search, sort] as const;
export const allManeuversKey = [maneuverKey, 'all'] as const;
export const createManeuverByIdKey = (id: string) => [maneuverKey, id] as const;

export const getManeuverQueryKey = (search: string | undefined, sort: string | undefined) => search 
    ? createSearchManeuversKey(search, sort)
    : allManeuversKey;