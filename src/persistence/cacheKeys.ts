import { searchParamKey } from "@/common/global/httpUtils";
import { DEFAULT_PAGE_SIZE, emptyUlid } from "@/common/global/pagination";

// Characters
const characterKey = 'characters';

export const createSearchCharactersKey = (search: string) => [characterKey, searchParamKey, search] as const;
export const allCharactersKey = [characterKey, 'all'] as const;
export const createCharacterByIdKey = (id: string) => [characterKey, id] as const;

export const getCharacterQueryKey = (search: string | undefined) => search 
    ? createSearchCharactersKey(search)
    : allCharactersKey;

// Maneuvers
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

// Perks
const perkKey = 'perks';
export const createPerkByIdKey = (id: string) => [perkKey, id] as const;
export function createKeysetSearchPerksKey
(
    search: string | undefined, 
    cursor: string = emptyUlid, 
    pageSize: number = DEFAULT_PAGE_SIZE
) 
{
    return [perkKey, searchParamKey, search, cursor, pageSize] as const;
}

// Stances
const stanceKey = 'stances';
export const createStanceByIdKey = (id: string) => [stanceKey, id] as const;
export function createKeysetSearchStancesKey
(
    search: string | undefined, 
    cursor: string = emptyUlid, 
    pageSize: number = DEFAULT_PAGE_SIZE
) 
{
    return [stanceKey, searchParamKey, search, cursor, pageSize] as const;
}

// States
const stateKey = 'states';
export const createStateByIdKey = (id: string) => [stateKey, id] as const;
export function createKeysetSearchStatesKey
(
    search: string | undefined, 
    cursor: string = emptyUlid, 
    pageSize: number = DEFAULT_PAGE_SIZE
) 
{
    return [stateKey, searchParamKey, search, cursor, pageSize] as const;
}

// Spells
const spellKey = 'spells';
export const createSpellByIdKey = (id: string) => [spellKey, id] as const;
export function createKeysetSearchSpellsKey
(
    search: string | undefined, 
    cursor: string = emptyUlid, 
    pageSize: number = DEFAULT_PAGE_SIZE
) 
{
    return [spellKey, searchParamKey, search, cursor, pageSize] as const;
}