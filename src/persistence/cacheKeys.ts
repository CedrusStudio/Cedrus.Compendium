import { searchParamKey } from "@/common/global/httpUtils";
import { DEFAULT_PAGE_SIZE, emptyUlid } from "@/common/global/pagination";

const characterKey = 'characters';

export const createSearchCharactersKey = (search: string) => [characterKey, searchParamKey, search] as const;
export const allCharactersKey = [characterKey, 'all'] as const;
export const createCharacterByIdKey = (id: string) => [characterKey, id] as const;

export const getCharacterQueryKey = (search: string | undefined) => search 
    ? createSearchCharactersKey(search)
    : allCharactersKey;

const maneuverKey = 'maneuvers';
export const createManeuverByIdKey = (id: string) => [maneuverKey, id] as const;

export function createSearchManeuversKey
(
    search: string | undefined, 
    sort: string | undefined, 
    sortDirection: "asc" | "desc" | undefined, 
    pageSize: number | undefined = DEFAULT_PAGE_SIZE
) 
{
    return [maneuverKey, searchParamKey, search, sort, sortDirection, pageSize] as const;
}

export function createKeysetSearchManeuversKey
(
    search: string | undefined, 
    cursor: string = emptyUlid, 
    pageSize: number = DEFAULT_PAGE_SIZE
) 
{
    return [maneuverKey, searchParamKey, search, cursor, pageSize] as const;
}