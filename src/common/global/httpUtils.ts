import { ReadonlyURLSearchParams } from "next/navigation";
import { type NextRequest } from 'next/server';

export const searchParamKey = 'search';
export const getSearchParamFromRequest = (request: NextRequest) => 
    request.nextUrl.searchParams.get(searchParamKey);

export const sortParamKey = 'sort';
export const sortDirectionParamKey = 'sortDirection';
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

export const getSortDirectionQueryParam = (searchParams: ReadonlyURLSearchParams): "asc" | "desc" => 
{
    const direction = searchParams.get(sortDirectionParamKey);
    if (direction !== "asc" && direction !== "desc") return "asc";
    return direction;
};

export const getCursorQueryParam = (searchParams: ReadonlyURLSearchParams) => 
{
    return searchParams.get('cursor') || "0000WZXVD68PVAE7QCBNH45B8F";
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

export function getSearchQuery(searchParams: { [key: string]: string | string[] | undefined })
{
    return Array.isArray(searchParams?.search) ? searchParams.search[0] : searchParams?.search;
};

export function getSortQuery(searchParams: { [key: string]: string | string[] | undefined })
{
    return Array.isArray(searchParams?.sort) ? searchParams.sort[0] : searchParams?.sort;
};

export function getSortDirectionQuery(searchParams: { [key: string]: string | string[] | undefined }): "asc" | "desc"
{
    const direction = Array.isArray(searchParams?.sortDirection) ? searchParams.sortDirection[0] : searchParams?.sortDirection
    if (direction !== "asc" && direction !== "desc") return "asc";
    return direction as "asc" | "desc";
};

export const getCursorQuery = (searchParams: { [key: string]: string | string[] | undefined }) => 
{
    return Array.isArray(searchParams?.cursor) ? searchParams.cursor[0] : searchParams?.cursor;
};