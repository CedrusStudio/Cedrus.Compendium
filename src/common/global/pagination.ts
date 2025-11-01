export const getTotalPages = (count: number, pageSize: number): number => Math.max(1, Math.ceil(count / pageSize));
export const getClampedPage = (page: number, totalPages: number): number => Math.min(Math.max(page, 1), totalPages);

export type OffsetPagination = 
{
  pageNumber: number;
  pageSize: number;
};

export type KeysetPagination = 
{
  cursor: string;
  pageSize: number;
};

export const emptyUlid = '00000000000000000000000000' as const;

export const DEFAULT_PAGE_SIZE = 10;

export function isOffsetPagination(pagination: OffsetPagination | KeysetPagination | undefined): pagination is OffsetPagination 
{
  return !!pagination && 'pageNumber' in pagination;
}

export function isKeysetPagination(pagination: OffsetPagination | KeysetPagination | undefined): pagination is KeysetPagination 
{
  return !!pagination && 'cursor' in pagination;
}

export function createOffsetPagination(pagination: OffsetPagination)
{
  return { 
    take: pagination.pageSize,
    skip: pagination.pageSize * (pagination.pageNumber - 1)
  };
}

export function createKeysetPagination(pagination: KeysetPagination)
{
  const where =
  {
    id: { gt: pagination.cursor }
  }

  return { 
    where,
    take: pagination.pageSize
  };
}
