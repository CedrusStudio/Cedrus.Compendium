export type SearchPayload = {
  search?: { [key: string]: string | number | boolean };
  sort?: [string, 'asc' | 'desc'];
  pagination?: OffsetPagination | KeysetPagination;
  select: Select;
};

export type Select = { [key: string]: boolean | Select };

type OffsetPagination = {
  pageNumber: number;
  pageSize: number;
};

type KeysetPagination = {
  cursor: string;
  pageSize: number;
};