import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const useQueryMock = vi.fn();
const useEntityTagsMock = vi.fn();
const useDispatchMock = vi.fn();
const useApiKeyMock = vi.fn();
const usePersonalizationMock = vi.fn();
const tagFilterSpy = vi.fn();
const visibilityFilterSpy = vi.fn();

vi.mock('@tanstack/react-query', () => ({
  useQuery: (...args: unknown[]) => useQueryMock(...args),
}));

vi.mock('@tanstack/react-table', () => ({
  getCoreRowModel: () => ({}),
  getFilteredRowModel: () => ({}),
  getSortedRowModel: () => ({}),
  useReactTable: () => ({
    getFilteredSelectedRowModel: () => ({ rows: [] }),
  }),
}));

vi.mock('@/common/hooks/useApiKey', () => ({
  useApiKey: () => useApiKeyMock(),
}));

vi.mock('@/common/hooks/usePersonalization', () => ({
  usePersonalization: () => usePersonalizationMock(),
}));

vi.mock('react-redux', () => ({
  useDispatch: () => useDispatchMock,
}));

vi.mock('use-debounce', () => ({
  useDebounce: (value: string) => [value],
}));

vi.mock('@/common/hooks/useEntityTags', () => ({
  useEntityTags: () => useEntityTagsMock(),
}));

vi.mock('@/application/bestiary/columns', () => ({
  columns: [],
  columnKeys: { initiative: 'initiative' },
}));

vi.mock('@/common/components/filters/TagFilter', () => ({
  default: (props: unknown) => {
    tagFilterSpy(props);
    return <div>Tag filter</div>;
  },
}));

vi.mock('@/common/components/filters/CharacterVisibilityFilter', () => ({
  default: (props: { value: string; onValueChange: (mode: string) => void; mineOnlyDisabled: boolean }) => {
    visibilityFilterSpy(props);
    return (
      <div>
        Visibility filter: {props.value}
        <button type="button" disabled={props.mineOnlyDisabled} onClick={() => props.onValueChange('mineOnly')}>mineOnly</button>
        <button type="button" onClick={() => props.onValueChange('publicOnly')}>publicOnly</button>
      </div>
    );
  },
}));

vi.mock('@/common/components/table/ColumnFilter', () => ({
  default: () => <div>Column filter</div>,
}));

vi.mock('@/application/bestiary/BestiaryTableFooter', () => ({
  default: () => <div>Footer</div>,
}));

vi.mock('@/common/components/table/DefaultTableHeader', () => ({
  default: () => <div>Header</div>,
}));

vi.mock('@/common/components/table/DefaultTableBody', () => ({
  default: () => <div>Body</div>,
}));

vi.mock('@/application/personalization/PersonalizedQuickTags', () => ({
  default: ({ mode }: { mode?: 'include' | 'exclude' }) => <div>{mode === 'exclude' ? 'Quick tags exclude' : 'Quick tags include'}</div>,
}));

vi.mock('@/persistence/mappings/characterMapping', () => ({
  toCharacters: (raw: unknown[]) => raw,
}));

vi.mock('react-infinite-scroll-component', () => ({
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

import BestiaryTable from '@/application/bestiary/BestiaryTable';

/**
 * The CHARACTERS search key, not the category-layer one.
 *
 * `useQuery` is mocked once for the whole module, so every hook in the tree goes
 * through it — since Wave 10.4 that includes `useTagFacets`, which renders below
 * this list and would therefore win a naive `.at(-1)`. Asking for the query we
 * actually mean keeps the assertion honest whatever else starts using `useQuery`.
 */
const lastCharactersQueryKey = (): unknown[] | undefined => useQueryMock.mock.calls
  .map(call => (call[0] as { queryKey?: unknown } | undefined)?.queryKey)
  .filter((key): key is unknown[] => Array.isArray(key) && key[0] !== 'tagFacets')
  .at(-1);

describe('BestiaryTable', () => {
  beforeEach(() => {
    useEntityTagsMock.mockReset();
    useQueryMock.mockReset();
    tagFilterSpy.mockReset();
    visibilityFilterSpy.mockReset();
    useApiKeyMock.mockReset();
    usePersonalizationMock.mockReset();

    useEntityTagsMock.mockReturnValue({ tags: [], isLoading: false });
    useQueryMock.mockReturnValue({ data: [] });
    usePersonalizationMock.mockReturnValue({ profile: {} });
    useApiKeyMock.mockReturnValue({ apiKey: null, isLoaded: true, hasApiKey: false, saveApiKey: vi.fn(), removeApiKey: vi.fn() });
  });

  it('disables the "mine only" visibility option when no API key is set', () => {
    render(<BestiaryTable />);

    expect(visibilityFilterSpy).toHaveBeenCalled();
    const props = visibilityFilterSpy.mock.calls.at(-1)?.[0] as { mineOnlyDisabled: boolean };
    expect(props.mineOnlyDisabled).toBe(true);
  });

  it('changing the visibility filter updates the characters query key', () => {
    useApiKeyMock.mockReturnValue({ apiKey: 'ABC', isLoaded: true, hasApiKey: true, saveApiKey: vi.fn(), removeApiKey: vi.fn() });

    render(<BestiaryTable />);
    const queryKeyBefore = lastCharactersQueryKey();

    fireEvent.click(screen.getByText('publicOnly'));
    const queryKeyAfter = lastCharactersQueryKey();

    expect(queryKeyAfter).not.toEqual(queryKeyBefore);
    expect(queryKeyAfter).toContain('publicOnly');
  });

  it('resets the visibility filter back to "all" once the API key is removed', () => {
    useApiKeyMock.mockReturnValue({ apiKey: 'ABC', isLoaded: true, hasApiKey: true, saveApiKey: vi.fn(), removeApiKey: vi.fn() });

    const { rerender } = render(<BestiaryTable />);

    fireEvent.click(screen.getByText('mineOnly'));
    expect(visibilityFilterSpy.mock.calls.at(-1)?.[0]).toMatchObject({ value: 'mineOnly' });

    useApiKeyMock.mockReturnValue({ apiKey: null, isLoaded: true, hasApiKey: false, saveApiKey: vi.fn(), removeApiKey: vi.fn() });
    rerender(<BestiaryTable />);

    expect(visibilityFilterSpy.mock.calls.at(-1)?.[0]).toMatchObject({ value: 'all' });
  });
});
