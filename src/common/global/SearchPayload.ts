export type SearchPayload = {
  search?: { [key: string]: string | number | boolean };
  sort?: { [key: string]: { order: 'asc' | 'desc' } };
  pagination?: OffsetPagination | KeysetPagination;
  select: Select;
};

type Select = { [key: string]: boolean | Select };

type OffsetPagination = {
  pageNumber: number;
  pageSize: number;
};

type KeysetPagination = {
  cursor: { [key: string]: string | number | boolean };
  pageSize: number;
};