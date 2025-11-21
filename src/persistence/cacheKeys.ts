import { searchParamKey } from "@/common/global/httpUtils";
import { DEFAULT_PAGE_SIZE, emptyUlid } from "@/common/global/pagination";
import { Style } from "@/domain/characters/equipment/Weapon";

// Characters
const characterKey = 'characters';

export const createSearchCharactersKey = (search: string, cursor: string, includeTags?: string[], pageSize?: number) => [characterKey, searchParamKey, search, cursor, includeTags?.join(',') || '', pageSize] as const;
export const allCharactersKey = [characterKey, 'all'] as const;
export const createCharacterByIdKey = (id: string) => [characterKey, id] as const;

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
    includeTags?: string[],
    pageSize: number = DEFAULT_PAGE_SIZE
) : readonly [string, string, string | undefined, string, string, number] 
{
    return [
        maneuverKey, 
        searchParamKey, 
        search || '', 
        cursor, 
        includeTags?.join(',') || '', 
        pageSize
    ] as const;
}

// Perks
const perkKey = 'perks';
export const createPerkByIdKey = (id: string) => [perkKey, id] as const;
export function createKeysetSearchPerksKey
(
    search: string | undefined, 
    cursor: string = emptyUlid,
    includeTags?: string[],
    pageSize: number = DEFAULT_PAGE_SIZE
) : readonly [string, string, string | undefined, string, string, number] 
{
    return [
        perkKey, 
        searchParamKey, 
        search || '', 
        cursor, 
        includeTags?.join(',') || '', 
        pageSize
    ] as const;
}

// Stances
const stanceKey = 'stances';
export const createStanceByIdKey = (id: string) => [stanceKey, id] as const;
export function createKeysetSearchStancesKey
(
    search: string | undefined, 
    cursor: string = emptyUlid,
    includeTags?: string[],
    pageSize: number = DEFAULT_PAGE_SIZE
) : readonly [string, string, string | undefined, string, string, number] 
{
    return [
        stanceKey, 
        searchParamKey, 
        search || '', 
        cursor, 
        includeTags?.join(',') || '', 
        pageSize
    ] as const;
}

// States
const stateKey = 'states';
export const createStateByIdKey = (id: string) => [stateKey, id] as const;
export function createKeysetSearchStatesKey
(
    search: string | undefined, 
    cursor: string = emptyUlid,
    includeTags?: string[],
    pageSize: number = DEFAULT_PAGE_SIZE
) : readonly [string, string, string | undefined, string, string, number] 
{
    return [
        stateKey, 
        searchParamKey, 
        search || '', 
        cursor, 
        includeTags?.join(',') || '', 
        pageSize
    ] as const;
}

// Spells
const spellKey = 'spells';
export const createSpellByIdKey = (id: string) => [spellKey, id] as const;
export function createKeysetSearchSpellsKey
(
    search: string | undefined, 
    cursor: string = emptyUlid,
    includeTags?: string[],
    pageSize: number = DEFAULT_PAGE_SIZE
) : readonly [string, string, string | undefined, string, string, number] 
{
    return [
        spellKey, 
        searchParamKey, 
        search || '', 
        cursor, 
        includeTags?.join(',') || '', 
        pageSize
    ] as const;
}

// Weapons
const weaponKey = 'weapons';
export const createWeaponByIdKey = (id: string) => [weaponKey, id] as const;
export function createKeysetSearchWeaponsKey
(
    search: string | undefined, 
    cursor: string = emptyUlid, 
    includeTags?: string[],
    pageSize: number = DEFAULT_PAGE_SIZE,
    style?: Style | "All"
) : readonly [string, string, string | undefined, string, string, string, number] 
{
    return [
        weaponKey, 
        searchParamKey, 
        search || '', 
        cursor, 
        includeTags?.join(',') || '', 
        style || '', 
        pageSize
    ] as const;
}
export function createKeysetSearchWeaponsKeyWithoutStyle
(
    search: string | undefined, 
    cursor: string = emptyUlid, 
    includeTags?: string[],
    pageSize: number = DEFAULT_PAGE_SIZE
) : readonly [string, string, string | undefined, string, string, number] 
{
    return [
        weaponKey, 
        searchParamKey, 
        search || '', 
        cursor, 
        includeTags?.join(',') || '', 
        pageSize
    ] as const;
}

// Armors
const armorKey = 'armors';
export const createArmorByIdKey = (id: string) => [armorKey, id] as const;
export function createKeysetSearchArmorsKey
(
    search: string | undefined, 
    cursor: string = emptyUlid,
    includeTags?: string[],
    pageSize: number = DEFAULT_PAGE_SIZE
) : readonly [string, string, string | undefined, string, string, number]  
{
    return [
        armorKey, 
        searchParamKey, 
        search || '', 
        cursor, 
        includeTags?.join(',') || '', 
        pageSize
    ] as const;
}

// Shields
const shieldKey = 'shields';
export const createShieldByIdKey = (id: string) => [shieldKey, id] as const;
export function createKeysetSearchShieldsKey
(
    search: string | undefined, 
    cursor: string = emptyUlid,
    includeTags?: string[],
    pageSize: number = DEFAULT_PAGE_SIZE
) : readonly [string, string, string | undefined, string, string, number] 
{
    return [
        shieldKey, 
        searchParamKey, 
        search || '', 
        cursor, 
        includeTags?.join(',') || '', 
        pageSize
    ] as const;
}

// Inventory
const inventoryKey = 'inventory';
export const createInventoryItemByIdKey = (id: string) => [inventoryKey, id] as const;
export function createKeysetSearchInventoryKey
(
    search: string | undefined, 
    cursor: string = emptyUlid,
    includeTags?: string[],
    pageSize: number = DEFAULT_PAGE_SIZE
) : readonly [string, string, string | undefined, string, string, number] 
{
    return [
        inventoryKey, 
        searchParamKey, 
        search || '', 
        cursor, 
        includeTags?.join(',') || '', 
        pageSize
    ] as const;
}

// Mounts
const mountKey = 'mounts';
export const createMountByIdKey = (id: string) => [mountKey, id] as const;
export function createKeysetSearchMountsKey
(
    search: string | undefined, 
    cursor: string = emptyUlid,
    includeTags?: string[],
    pageSize: number = DEFAULT_PAGE_SIZE
) : readonly [string, string, string | undefined, string, string, number] 
{
    return [
        mountKey, 
        searchParamKey, 
        search || '', 
        cursor, 
        includeTags?.join(',') || '', 
        pageSize
    ] as const;
}