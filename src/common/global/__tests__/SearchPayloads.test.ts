import { anyOfValues, collectRequirementFilters, createExcludeFiltering, createFiltering, isUsableRequirementFilter } from '@/common/global/SearchPayloads';
import { describe, expect, it } from 'vitest';

describe('collectRequirementFilters (Wave 6.2)', () => {
  it('merges the plural field with the legacy singular one', () => {
    expect(collectRequirementFilters({
      requirementFilters: [{ kind: 'text', text: 'a' }],
      requirementFilter: { kind: 'text', text: 'b' },
    })).toEqual([{ kind: 'text', text: 'a' }, { kind: 'text', text: 'b' }]);
  });

  it('still accepts a payload built before multi-filter existed', () => {
    expect(collectRequirementFilters({ requirementFilter: { kind: 'text', text: 'x' } }))
      .toEqual([{ kind: 'text', text: 'x' }]);
  });

  it('returns an empty list when no requirement filter is set', () => {
    expect(collectRequirementFilters({})).toEqual([]);
  });

  it('drops half-filled filters so a partially typed UI state cannot corrupt the query', () => {
    expect(collectRequirementFilters({
      requirementFilters: [
        { kind: 'text', text: '   ' },
        { kind: 'ranked', group: 'perks', targetKey: '', maxValue: 2 },
        { kind: 'ranked', group: 'perks', targetKey: 'X', maxValue: Number.NaN },
        { kind: 'ranked', group: 'perks', targetKey: 'OK', maxValue: 0 },
      ],
    })).toEqual([{ kind: 'ranked', group: 'perks', targetKey: 'OK', maxValue: 0 }]);
  });

  it('guards undefined', () => {
    expect(isUsableRequirementFilter(undefined)).toBe(false);
  });
});

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