import { describe, expect, it, vi } from 'vitest';
import { renderHook } from '@testing-library/react';

const { useQueryMock } = vi.hoisted(() => ({ useQueryMock: vi.fn() }));

vi.mock('@tanstack/react-query', () => ({ useQuery: (...args: unknown[]) => useQueryMock(...args) }));

import { useTagFacets } from '@/common/hooks/useTagFacets';

/**
 * The category layer is DESCRIPTIVE — it must never be able to break the list it
 * decorates. These cases are the shapes a real deployment can actually return:
 * an error envelope from a proxy, an HTML error page parsed into something odd,
 * a half-written cache entry. Each one used to throw inside render and take the
 * whole page down, because `data ?? EMPTY_INDEX` only guards against undefined.
 */
describe('useTagFacets', () => {
  const render = (data: unknown) => {
    useQueryMock.mockReturnValue({ data, isLoading: false });
    return renderHook(() => useTagFacets('maneuvers')).result.current;
  };

  it('returns an empty index when the query has no data yet', () => {
    expect(render(undefined)).toMatchObject({ hasFacets: false });
    expect(render(undefined).index.facets).toEqual([]);
  });

  it('survives an object with no facets — an error envelope, not an index', () => {
    const result = render({ message: 'Server error' });

    expect(result.index.facets).toEqual([]);
    expect(result.index.unassigned).toEqual([]);
    expect(result.hasFacets).toBe(false);
  });

  it('survives an array, which is what a shared useQuery mock hands every caller', () => {
    expect(render([{ id: '1' }]).hasFacets).toBe(false);
  });

  it('survives null and a bare string', () => {
    expect(render(null).hasFacets).toBe(false);
    expect(render('<!doctype html>').hasFacets).toBe(false);
  });

  it('falls back to the requested entity when the payload does not name one', () => {
    expect(render({ facets: [], unassigned: [] }).index.entity).toBe('maneuvers');
  });

  it('passes a well-formed index straight through', () => {
    const facet = { key: 'rola', label: 'Rola', order: 1, selectionMode: 'multi', supportsNone: true, entities: ['maneuvers'], values: [], allSpellings: [] };
    const result = render({ entity: 'maneuvers', facets: [facet], unassigned: ['specjalne'] });

    expect(result.hasFacets).toBe(true);
    expect(result.index.facets).toEqual([facet]);
    expect(result.index.unassigned).toEqual(['specjalne']);
  });
});
