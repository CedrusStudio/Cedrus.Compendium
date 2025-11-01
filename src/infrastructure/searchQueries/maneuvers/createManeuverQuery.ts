import { DEFAULT_PAGE_SIZE, emptyUlid, KeysetPagination, OffsetPagination } from "@/common/global/pagination";
import { SearchEntityPayload } from "@/common/global/SearchPayloads";

export function createManeuverQuery
(
  searchQuery?: string | undefined, 
  sortQuery?: string | undefined,
  sortDirectionQuery?: 'asc' | 'desc' | undefined,
  pagination?: OffsetPagination | KeysetPagination | undefined,
)
  : SearchEntityPayload
{ 
  const sortWithDirection = sortQuery ? [{ [sortQuery]: sortDirectionQuery || "asc" }] : undefined;

  return {
    entity: 'maneuver',
    search: searchQuery ? { name: searchQuery } : undefined,
    sort: sortWithDirection || [{ name: 'asc' }],
    pagination: pagination || { pageNumber: 1, pageSize: DEFAULT_PAGE_SIZE }
  };
};

export function createManeuverKeysetQuery
(
  searchQuery: string | undefined, 
  cursor: string = emptyUlid,
  pageSize: number = DEFAULT_PAGE_SIZE
)
  : SearchEntityPayload
{ 
  return {
    entity: 'maneuver',
    search: searchQuery ? { name: searchQuery } : undefined,
    pagination: { cursor, pageSize }
  };
};