import { ReadonlyURLSearchParams } from "next/navigation";
import { type NextRequest } from 'next/server';

export const searchParamKey = 'search';
export const getSearchParamFromRequest = (request: NextRequest) => 
    request.nextUrl.searchParams.get(searchParamKey);

export const sortParamKey = 'sort';
export const getSortParamFromRequest = (request: NextRequest) => 
    request.nextUrl.searchParams.get(sortParamKey);

export const getSearchQueryParam = (searchParams: ReadonlyURLSearchParams) => 
{
    return searchParams.get(searchParamKey) ?? undefined;
};

export const getSortQueryParam = (searchParams: ReadonlyURLSearchParams) => 
{
    return searchParams.get(sortParamKey) ?? undefined;
};

export const getIdQueryParam = (searchParams: ReadonlyURLSearchParams) => 
{
    return searchParams.get('id') ?? undefined;
};

export const setSearchQueryParam = (url: URL, search?: string) => 
{
    if (search) url.searchParams.set(searchParamKey, search);
};

export const setSortQueryParam = (url: URL, sort?: string) => 
{
    if (sort) url.searchParams.set(sortParamKey, sort);
};

export async function getSearchQuery(searchParams: { [key: string]: string | string[] | undefined })
{
    return Array.isArray(searchParams?.search) ? searchParams.search[0] : searchParams?.search;
};

export async function getSortQuery(searchParams: { [key: string]: string | string[] | undefined })
{
    return Array.isArray(searchParams?.sort) ? searchParams.sort[0] : searchParams?.sort;
};