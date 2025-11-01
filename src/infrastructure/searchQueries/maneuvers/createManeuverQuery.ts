import { DEFAULT_PAGE_SIZE, KeysetPagination, OffsetPagination } from "@/common/global/pagination";
import { SearchEntityPayload } from "@/common/global/SearchPayloads";

export const createManeuverQuery = 
(
  searchQuery?: string | undefined, 
  sortQuery?: string | undefined,
  sortDirectionQuery?: 'asc' | 'desc' | undefined,
  pagination?: OffsetPagination | KeysetPagination | undefined,
)
  : SearchEntityPayload => 
{ 
  const sortWithDirection = sortQuery ? [{ [sortQuery]: sortDirectionQuery || "asc" }] : undefined;

  return {
    entity: 'maneuver',
    search: searchQuery ? { name: searchQuery } : undefined,
    sort: sortWithDirection || [{ name: 'asc' }],
    pagination: pagination || { pageNumber: 1, pageSize: DEFAULT_PAGE_SIZE }
  };
};