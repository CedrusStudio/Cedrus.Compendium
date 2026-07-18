import { describe, it, expect } from 'vitest';
import { SearchQueryBuilder } from '@/infrastructure/searchQueries/SearchQueryBuilder';

describe('SearchQueryBuilder', () => {
  describe('Basic query building', () => {
    it('should build query with entity name', () => {
      const query = SearchQueryBuilder.for('character')
        .offsetPagination(1, 10)
        .build();
      
      expect(query.entity).toBe('character');
      expect(query.pagination).toEqual({ pageNumber: 1, pageSize: 10 });
    });

    it('should build query with search filters', () => {
      const query = SearchQueryBuilder.for('character')
        .searchFilter('name', 'Warrior')
        .offsetPagination(1, 10)
        .build();
      
      expect(query.search).toEqual({ name: 'Warrior' });
    });

    it('should skip empty string search filters', () => {
      const query = SearchQueryBuilder.for('character')
        .searchFilter('name', '')
        .searchFilter('tags', 'warrior')
        .offsetPagination(1, 10)
        .build();
      
      expect(query.search).toEqual({ tags: 'warrior' });
    });

    it('should skip undefined search filters', () => {
      const query = SearchQueryBuilder.for('character')
        .searchFilter('name', undefined)
        .offsetPagination(1, 10)
        .build();
      
      expect(query.search).toBeUndefined();
    });

    it('should build query with scalar multi-value search filters', () => {
      const query = SearchQueryBuilder.for('spell')
        .searchInFilter('castTime', ['Standardowa', 'Natychmiastowa'])
        .offsetPagination(1, 10)
        .build();

      expect(query.search).toEqual({ castTime: { anyOf: ['Standardowa', 'Natychmiastowa'] } });
    });

    it('should skip empty scalar multi-value search filters', () => {
      const query = SearchQueryBuilder.for('spell')
        .searchInFilter('castTime', [])
        .offsetPagination(1, 10)
        .build();

      expect(query.search).toBeUndefined();
    });
  });

  describe('Exclude filters', () => {
    it('should build query with exclude filters', () => {
      const query = SearchQueryBuilder.for('character')
        .excludeFilter('tags', 'npc')
        .offsetPagination(1, 10)
        .build();
      
      expect(query.exclude).toEqual({ tags: 'npc' });
    });

    it('should skip empty exclude filters', () => {
      const query = SearchQueryBuilder.for('character')
        .excludeFilter('tags', '')
        .offsetPagination(1, 10)
        .build();
      
      expect(query.exclude).toBeUndefined();
    });

    it('should build query with scalar multi-value exclude filters', () => {
      const query = SearchQueryBuilder.for('spell')
        .excludeInFilter('castTime', ['Pełnorundowa'])
        .offsetPagination(1, 10)
        .build();

      expect(query.exclude).toEqual({ castTime: { anyOf: ['Pełnorundowa'] } });
    });
  });

  describe('Sorting', () => {
    it('should build query with single sort', () => {
      const query = SearchQueryBuilder.for('character')
        .sort('name', 'asc')
        .offsetPagination(1, 10)
        .build();
      
      expect(query.sort).toEqual([{ name: 'asc' }]);
    });

    it('should build query with multiple sorts', () => {
      const query = SearchQueryBuilder.for('character')
        .sort('name', 'asc')
        .sort('id', 'desc')
        .offsetPagination(1, 10)
        .build();
      
      expect(query.sort).toEqual([{ name: 'asc' }, { id: 'desc' }]);
    });

    it('should not add sort when field is undefined and no fallback', () => {
      const query = SearchQueryBuilder.for('character')
        .sort(undefined, 'asc')
        .offsetPagination(1, 10)
        .build();
      
      expect(query.sort).toBeUndefined();
    });
  });

  describe('Pagination', () => {
    it('should build query with offset pagination', () => {
      const query = SearchQueryBuilder.for('character')
        .offsetPagination(2, 20)
        .build();
      
      expect(query.pagination).toEqual({ pageNumber: 2, pageSize: 20 });
    });

    it('should build query with cursor pagination', () => {
      const query = SearchQueryBuilder.for('character')
        .cursorPagination('cursor123', 15)
        .build();
      
      expect(query.pagination).toEqual({ cursor: 'cursor123', pageSize: 15 });
    });

    it('should use default pagination when not specified', () => {
      const query = SearchQueryBuilder.for('character')
        .pagination(undefined)
        .build();
      
      expect(query.pagination).toEqual({ pageNumber: 1, pageSize: 10 });
    });

    it('should throw error when pageSize is less than 1', () => {
      expect(() => {
        SearchQueryBuilder.for('character')
          .offsetPagination(1, 0)
          .build();
      }).toThrow('Page size must be at least 1.');
    });

    it('should throw error when pageNumber is less than 1', () => {
      expect(() => {
        SearchQueryBuilder.for('character')
          .offsetPagination(0, 10)
          .build();
      }).toThrow('Page number must be at least 1.');
    });

    it('should throw error when cursor is empty', () => {
      expect(() => {
        SearchQueryBuilder.for('character')
          .cursorPagination('', 10)
          .build();
      }).toThrow('Cursor cannot be empty for keyset pagination.');
    });
  });

  describe('Select and Include', () => {
    it('should build query with select', () => {
      const query = SearchQueryBuilder.for('character')
        .select({ name: true, id: true })
        .offsetPagination(1, 10)
        .build();
      
      expect(query.select).toEqual({ name: true, id: true });
    });

    it('should build query with include', () => {
      const query = SearchQueryBuilder.for('character')
        .include({ race: true, perks: true })
        .offsetPagination(1, 10)
        .build();
      
      expect(query.include).toEqual({ race: true, perks: true });
    });

    it('should throw error when using both select and include', () => {
      expect(() => {
        SearchQueryBuilder.for('character')
          .select({ name: true })
          .include({ race: true })
          .offsetPagination(1, 10)
          .build();
      }).toThrow('Cannot use both select and include. Choose one option.');
    });

    it('should merge multiple selects', () => {
      const query = SearchQueryBuilder.for('character')
        .select({ name: true })
        .select({ id: true })
        .offsetPagination(1, 10)
        .build();
      
      expect(query.select).toEqual({ name: true, id: true });
    });
  });

  describe('Complex queries', () => {
    it('should build complex query with all options', () => {
      const query = SearchQueryBuilder.for('character')
        .searchFilter('name', 'Warrior')
        .searchFilter('tags', 'fighter')
        .excludeFilter('tags', 'npc')
        .sort('name', 'asc')
        .sort('id', 'desc')
        .select({ name: true, id: true })
        .offsetPagination(2, 25)
        .build();
      
      expect(query).toEqual({
        entity: 'character',
        search: {
          name: 'Warrior',
          tags: 'fighter'
        },
        exclude: {
          tags: 'npc'
        },
        sort: [
          { name: 'asc' },
          { id: 'desc' }
        ],
        select: {
          name: true,
          id: true
        },
        pagination: {
          pageNumber: 2,
          pageSize: 25
        }
      });
    });

    it('should chain multiple searchFilter calls', () => {
      const query = SearchQueryBuilder.for('character')
        .searchFilter('name', 'Test')
        .searchFilter('tags', 'warrior')
        .offsetPagination(1, 10)
        .build();
      
      expect(query.search).toEqual({
        name: 'Test',
        tags: 'warrior'
      });
    });

    it('should handle empty search and exclude after filtering', () => {
      const query = SearchQueryBuilder.for('character')
        .searchFilter('name', '')
        .searchFilter('tags', undefined)
        .offsetPagination(1, 10)
        .build();
      
      expect(query.search).toBeUndefined();
    });
  });

  describe('Character visibility filter', () => {
    it('should add characterVisibilityMode when set to "mineOnly"', () => {
      const query = SearchQueryBuilder.for('character')
        .visibilityFilter('mineOnly')
        .offsetPagination(1, 10)
        .build();

      expect(query.characterVisibilityMode).toBe('mineOnly');
    });

    it('should add characterVisibilityMode when set to "publicOnly"', () => {
      const query = SearchQueryBuilder.for('character')
        .visibilityFilter('publicOnly')
        .offsetPagination(1, 10)
        .build();

      expect(query.characterVisibilityMode).toBe('publicOnly');
    });

    it('should omit characterVisibilityMode when set to "all" (matches today\'s default payload)', () => {
      const query = SearchQueryBuilder.for('character')
        .visibilityFilter('all')
        .offsetPagination(1, 10)
        .build();

      expect(query.characterVisibilityMode).toBeUndefined();
    });

    it('should omit characterVisibilityMode when not called at all', () => {
      const query = SearchQueryBuilder.for('character')
        .offsetPagination(1, 10)
        .build();

      expect(query.characterVisibilityMode).toBeUndefined();
    });

    it('should omit characterVisibilityMode when passed undefined', () => {
      const query = SearchQueryBuilder.for('character')
        .visibilityFilter(undefined)
        .offsetPagination(1, 10)
        .build();

      expect(query.characterVisibilityMode).toBeUndefined();
    });
  });

  describe('Method chaining', () => {
    it('should support fluent API', () => {
      const builder = SearchQueryBuilder.for('character');
      
      const result = builder
        .searchFilter('name', 'Test')
        .sort('name', 'asc')
        .offsetPagination(1, 10);
      
      expect(result).toBe(builder);
    });
  });
});
