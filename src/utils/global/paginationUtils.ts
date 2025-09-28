export const getTotalPages = (count: number, pageSize: number): number => Math.max(1, Math.ceil(count / pageSize));
export const getClampedPage = (page: number, totalPages: number): number => Math.min(Math.max(page, 1), totalPages);
