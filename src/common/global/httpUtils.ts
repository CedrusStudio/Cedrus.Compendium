import { ReadonlyURLSearchParams } from "next/navigation";
import { type NextRequest } from 'next/server';

export const searchParamKey = 'search';
export const getSearchParamFromRequest = (request: NextRequest) => request.nextUrl.searchParams.get(searchParamKey);

export const getSearchQueryParam = (searchParams: ReadonlyURLSearchParams) => 
{
    return searchParams.get(searchParamKey) ?? undefined;
};

export const getQueryByIdParam = (searchParams: ReadonlyURLSearchParams) => 
{
    return searchParams.get('id') ?? undefined;
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