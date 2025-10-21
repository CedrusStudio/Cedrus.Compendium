import { ReadonlyURLSearchParams } from "next/navigation";
import { type NextRequest } from 'next/server';

export const searchParamKey = 'search';
export const getSearchParamFromRequest = (request: NextRequest) => 
    request.nextUrl.searchParams.get(searchParamKey);

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

export async function getSearchQuery(searchParams: { [key: string]: string | string[] | undefined })
{
    return Array.isArray(searchParams?.search) ? searchParams.search[0] : searchParams?.search;
};