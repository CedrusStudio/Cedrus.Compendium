import { ReadonlyURLSearchParams } from "next/navigation";
import { type NextRequest } from 'next/server';

export const searchParamKey = 'search';
export const getSearchParamFromRequest = (request: NextRequest) => request.nextUrl.searchParams.get(searchParamKey);

export const createSearchCharactersKey = (search: string) => ['characters', searchParamKey, search] as const;
export const allCharactersKey = ['characters', 'all'] as const;
export const createCharacterByIdKey = (id: string) => ['characters', id] as const;

export const getCharacterQueryKey = (search: string | undefined) => search 
    ? createSearchCharactersKey(search)
    : allCharactersKey;

export const getSearchQueryParam = (searchParams: ReadonlyURLSearchParams) => 
{
    return searchParams.get(searchParamKey) ?? undefined;
};

export const setSearchQueryParam = (url: URL, search?: string) => 
{
    if (search) url.searchParams.set(searchParamKey, search);
};

type SearchQueryWrapper = 
{
  searchParams: { [key: string]: string | string[] | undefined }
};

export async function getSearchQuery(input: SearchQueryWrapper)
{
    const searchParams = await input.searchParams;
    return Array.isArray(searchParams?.search) ? searchParams.search[0] : searchParams?.search;
};