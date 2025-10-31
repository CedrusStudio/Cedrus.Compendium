import { searchParamKey } from "@/common/global/httpUtils";

const characterKey = 'characters';

export const createSearchCharactersKey = (search: string) => [characterKey, searchParamKey, search] as const;
export const allCharactersKey = [characterKey, 'all'] as const;
export const createCharacterByIdKey = (id: string) => [characterKey, id] as const;

export const getCharacterQueryKey = (search: string | undefined) => search 
    ? createSearchCharactersKey(search)
    : allCharactersKey;

const maneuverKey = 'maneuvers';
const createSearchManeuversKey = (search?: string, sort?: string, sortDirection?: "asc" | "desc") => [maneuverKey, searchParamKey, search, sort, sortDirection] as const;
export const allManeuversKey = [maneuverKey, 'all'] as const;
export const createManeuverByIdKey = (id: string) => [maneuverKey, id] as const;

export const createSearchManeuversKeyWithFallback = (search: string | undefined, sort: string | undefined, sortDirection: "asc" | "desc" | undefined) => 
    (search || sort)
        ? createSearchManeuversKey(search, sort, sortDirection)
        : allManeuversKey;