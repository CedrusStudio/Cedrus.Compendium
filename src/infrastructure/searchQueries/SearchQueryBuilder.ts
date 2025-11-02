import { DEFAULT_PAGE_SIZE, isKeysetPagination, isOffsetPagination, KeysetPagination, OffsetPagination } from "@/common/global/pagination";
import { EntityName, EntityTypeMap, SearchEntityPayload, SearchValueInput, Select } from "@/common/global/SearchPayloads";

export class SearchQueryBuilder<TEntity> 
{
  private _entity: string;
  private _search?: Record<keyof TEntity, SearchValueInput>;
  private _sort?: Array<{ [key: string]: 'asc' | 'desc' }>;
  private _select?: Select;
  private _include?: Record<string, boolean>;
  private _pagination?: OffsetPagination | KeysetPagination;

  private constructor(entity: string) 
  {
    this._entity = entity;
  }

  static for<K extends EntityName>(entityName: K): SearchQueryBuilder<EntityTypeMap[K]> 
  {
    return new SearchQueryBuilder<EntityTypeMap[K]>(entityName);
  }

  search(filters: Record<keyof TEntity, SearchValueInput>): this 
  {
    this._search = { ...this._search, ...filters };
    return this;
  }

  searchFilter(key: keyof TEntity, value: SearchValueInput): this 
  {
    if (!this._search) 
    {
      this._search = {} as Record<keyof TEntity, SearchValueInput>;
    }

    if (value === undefined || value === null || (typeof value === 'string' && value.trim() === '')) 
    {
      return this;
    }

    this._search[key] = value;
    return this;
  }

  sort(field: keyof TEntity | undefined, direction: 'asc' | 'desc' = 'asc', fallback: Array<{ [key: string]: 'asc' | 'desc' }> = []): this 
  {
    if (!field) 
    {
      if (fallback.length > 0) 
      {
        this._sort = fallback;
      }

      return this;
    }

    if (!this._sort) 
    {
      this._sort = [];
    }

    this._sort.push({ [field]: direction });
    return this;
  }

  pagination(pagination: OffsetPagination | KeysetPagination | undefined): this 
  {
    this._pagination = pagination || { pageNumber: 1, pageSize: DEFAULT_PAGE_SIZE };
    return this;
  }

  cursorPagination(cursor: string, pageSize: number): this 
  {
    this._pagination = { cursor, pageSize };
    return this;
  }

  offsetPagination(pageNumber: number, pageSize: number): this 
  {
    this._pagination = { pageNumber, pageSize };
    return this;
  }

  select(fields: Select): this 
  {
    this._select = this.mergeSelect(this._select, fields);
    return this;
  }

  addSelectField(path: string, value: boolean | Select): this 
  {
    if (!this._select) 
    {
      this._select = {};
    }

    const keys = path.split('.');
    let current: Select = this._select;

    for (let i = 0; i < keys.length - 1; i++) 
    {
      const key = keys[i];

      if (!current[key] || typeof current[key] === 'boolean') 
      {
        current[key] = {};
      }

      current = current[key];
    }

    current[keys[keys.length - 1]] = value;
    return this;
  }

  include(relations: Record<string, boolean>): this 
  {
    this._include = { ...this._include, ...relations };
    return this;
  }

  build() : SearchEntityPayload
  {
    this.validatePagination();

    const query: SearchEntityPayload = 
    {
      entity: this._entity,
    };

    if (this._search && Object.keys(this._search).length > 0) 
    {
      query.search = this._search;
    }

    if (this._sort && this._sort.length > 0) 
    {
      query.sort = this._sort;
    }

    if (this._pagination) 
    {
      query.pagination = this._pagination;
    }

    const hasSelect = this._select && Object.keys(this._select).length > 0;
    const hasInclude = this._include;
    if (hasSelect && hasInclude) throw new Error('Cannot use both select and include. Choose one option.');
    
    if (!hasSelect && !hasInclude) return query;
    if (hasSelect) return { ...query, select: this._select };
    if (hasInclude) return { ...query, include: this._include };
    throw new Error('Unexpected error in build method.');
  }

  reset(): this 
  {
    this._search = undefined;
    this._sort = undefined;
    this._pagination = undefined;
    this._select = undefined;
    this._include = undefined;
    return this;
  }

  clone(): SearchQueryBuilder<TEntity> 
  {
    const cloned = new SearchQueryBuilder<TEntity>(this._entity);
    cloned._search = this._search ? { ...this._search } : undefined;
    cloned._sort = this._sort ? [...this._sort] : undefined;
    cloned._pagination = this._pagination ? { ...this._pagination } : undefined;
    cloned._select = this._select ? this.deepCloneSelect(this._select) : undefined;
    cloned._include = this._include ? { ...this._include } : undefined;
    return cloned;
  }

  private mergeSelect(target: Select | undefined, source: Select): Select 
  {
    if (!target) return { ...source };
    const result = { ...target };

    for (const key in source) 
    {
      const sourceValue = source[key];
      const targetValue = result[key];

      if (typeof sourceValue === 'object' && sourceValue !== null && 
          typeof targetValue === 'object' && targetValue !== null) 
      {
        result[key] = this.mergeSelect(targetValue as Select, sourceValue as Select);
        continue;
      }

      result[key] = sourceValue;
    }

    return result;
  }

  private deepCloneSelect(select: Select): Select 
  {
    const cloned: Select = {};

    for (const key in select) 
    {
      const value = select[key];

      if (typeof value === 'object' && value !== null) 
      {
        cloned[key] = this.deepCloneSelect(value as Select);
        continue;
      } 

      cloned[key] = value;
    }

    return cloned;
  }

  private validatePagination(): void 
  {
    const isOffset = isOffsetPagination(this._pagination);
    const isKeyset = isKeysetPagination(this._pagination);
    if (isOffset && isKeyset) throw new Error('Cannot use both offset and keyset pagination. Choose one pagination type.');
    if (!this._pagination || !isOffset && !isKeyset) throw new Error('Must use either offset or keyset pagination. Choose one pagination type.');
    if (this._pagination.pageSize < 1) throw new Error('Page size must be at least 1.');

    if (isOffset) 
    {
      const offset = this._pagination as OffsetPagination;
      if (offset.pageNumber < 1) throw new Error('Page number must be at least 1.');
      return;
    }

    const keyset = this._pagination as KeysetPagination;
    if (!keyset.cursor.trim()) throw new Error('Cursor cannot be empty for keyset pagination.');
  }
}