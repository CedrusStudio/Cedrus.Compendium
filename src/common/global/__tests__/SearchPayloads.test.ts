import { anyOfValues, createExcludeFiltering, createFiltering } from '@/common/global/SearchPayloads';
import { describe, expect, it } from 'vitest';

describe('SearchPayloads', () => {
  it('maps scalar multi-value include filters to prisma in filters', () => {
    const filters = createFiltering({
      search: {
        castTime: anyOfValues(['Standardowa', 'Natychmiastowa']),
      },
    });

    expect(filters).toEqual({
      castTime: { in: ['Standardowa', 'Natychmiastowa'] },
    });
  });

  it('maps scalar multi-value exclude filters to prisma in filters for NOT wrapping', () => {
    const filters = createExcludeFiltering({
      exclude: {
        castTime: anyOfValues(['Pełnorundowa']),
      },
    });

    expect(filters).toEqual({
      castTime: { in: ['Pełnorundowa'] },
    });
  });

  it('preserves existing array semantics for collection fields like tags', () => {
    const includeFilters = createFiltering({
      search: {
        tags: ['arcane', 'ritual'],
      },
    });

    const excludeFilters = createExcludeFiltering({
      exclude: {
        tags: ['rare'],
      },
    });

    expect(includeFilters).toEqual({
      tags: { hasEvery: ['arcane', 'ritual'] },
    });

    expect(excludeFilters).toEqual({
      tags: { hasSome: ['rare'] },
    });
  });
});