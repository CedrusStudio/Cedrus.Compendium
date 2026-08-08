import { DEFAULT_PAGE_SIZE, isKeysetPagination, isOffsetPagination, KeysetPagination, OffsetPagination } from "@/common/global/pagination";
import { anyOfValues, CharacterVisibilityMode, EntityName, EntityTypeMap, isUsableRequirementFilter, isUsableTagFacetFilter, RequirementSearchFilter, SearchEntityPayload, SearchScalarValueInput, SearchValueInput, Select, TagFacetFilter } from "@/common/global/SearchPayloads";

export class SearchQueryBuilder<TEntity> 
{
  private _entity: string;
  private _search?: Record<keyof TEntity, SearchValueInput>;
  private _exclude?: Record<keyof TEntity, SearchValueInput>;
  private _sort?: Array<{ [key: string]: 'asc' | 'desc' }>;
  private _select?: Select;
  private _include?: Record<string, boolean>;
  private _pagination?: OffsetPagination | KeysetPagination;
  private _characterVisibilityMode?: CharacterVisibilityMode;
  private _requirementFilters: RequirementSearchFilter[] = [];
  private _tagFacetFilters: TagFacetFilter[] = [];

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

  searchInFilter(key: keyof TEntity, values: SearchScalarValueInput[]): this
  {
    if (values.length === 0)
    {
      return this;
    }

    return this.searchFilter(key, anyOfValues(values));
  }

  excludeFilter(key: keyof TEntity, value: SearchValueInput): this 
  {
    if (!this._exclude) 
    {
      this._exclude = {} as Record<keyof TEntity, SearchValueInput>;
    }

    if (value === undefined || value === null || (typeof value === 'string' && value.trim() === '')) 
    {
      return this;
    }

    this._exclude[key] = value;
    return this;
  }

  excludeInFilter(key: keyof TEntity, values: SearchScalarValueInput[]): this
  {
    if (values.length === 0)
    {
      return this;
    }

    return this.excludeFilter(key, anyOfValues(values));
  }

  visibilityFilter(mode: CharacterVisibilityMode | undefined): this
  {
    if (!mode || mode === 'all') return this; // 'all' = omit the field, same as today's payload
    this._characterVisibilityMode = mode;
    return this;
  }

  /**
   * Wave 6.2: accumulates instead of overwriting, so repeated calls (or a single
   * call with an array) AND together. Unusable entries — blank text, missing
   * target — are dropped, which is what lets the UI hold a half-typed filter
   * without corrupting the query.
   */
  requirementFilter(filter: RequirementSearchFilter | RequirementSearchFilter[] | undefined): this
  {
    const incoming = Array.isArray(filter) ? filter : [filter];
    this._requirementFilters.push(...incoming.filter(isUsableRequirementFilter));
    return this;
  }

  /**
   * Wave 10.3: accumulates like `requirementFilter` does. Filters that would
   * narrow nothing (no values, no "— brak —") are dropped, so the UI can hold a
   * facet section the user has opened but not chosen anything in.
   */
  tagFacetFilter(filter: TagFacetFilter | TagFacetFilter[] | undefined): this
  {
    const incoming = Array.isArray(filter) ? filter : [filter];
    this._tagFacetFilters.push(...incoming.filter(isUsableTagFacetFilter));
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

    if (this._exclude && Object.keys(this._exclude).length > 0) 
    {
      query.exclude = this._exclude;
    }

    if (this._sort && this._sort.length > 0) 
    {
      query.sort = this._sort;
    }

    if (this._pagination)
    {
      query.pagination = this._pagination;
    }

    if (this._characterVisibilityMode)
    {
      query.characterVisibilityMode = this._characterVisibilityMode;
    }

    if (this._requirementFilters.length > 0)
    {
      query.requirementFilters = this._requirementFilters;
    }

    if (this._tagFacetFilters.length > 0)
    {
      query.tagFacetFilters = this._tagFacetFilters;
    }

    const hasSelect = this._select && Object.keys(this._select).length > 0;
    const hasInclude = this._include;
    if (hasSelect && hasInclude) throw new Error('Cannot use both select and include. Choose one option.');
    
    if (!hasSelect && !hasInclude) return query;
    if (hasSelect) return { ...query, select: this._select };
    if (hasInclude) return { ...query, include: this._include };
    throw new Error('Unexpected error in build method.');
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