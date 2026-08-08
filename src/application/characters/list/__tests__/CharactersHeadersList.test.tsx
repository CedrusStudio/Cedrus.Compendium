import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CharacterTag } from '@/domain/Tag';

const useQueryMock = vi.fn();
const useEntityTagsMock = vi.fn();
const useDispatchMock = vi.fn();
const useApiKeyMock = vi.fn();
const tagFilterSpy = vi.fn();
const visibilityFilterSpy = vi.fn();

vi.mock('@tanstack/react-query', () => ({
  useQuery: (...args: unknown[]) => useQueryMock(...args),
}));

vi.mock('@/common/hooks/useApiKey', () => ({
  useApiKey: () => useApiKeyMock(),
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

vi.mock('@/application/personalization/PersonalizedQuickTags', () => ({
  default: ({ mode }: { mode?: 'include' | 'exclude' }) => <div>{mode === 'exclude' ? 'Quick tags exclude' : 'Quick tags include'}</div>,
}));

vi.mock('@/common/components/WithScroll', () => ({
  WithScroll: ({ items, renderItem }: { items: unknown[]; renderItem: (item: any) => React.ReactNode }) => <div>{items.map(renderItem)}</div>,
}));

vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string; children: React.ReactNode }) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

vi.mock('@/application/personalization/FavoriteCharacterButton', () => ({
  default: ({ characterId }: { characterId: string }) => <button type="button">Favorite {characterId}</button>,
}));

vi.mock('@/application/personalization/MainCharacterButton', () => ({
  default: ({ characterId }: { characterId: string }) => <button type="button">Main {characterId}</button>,
}));

import CharactersHeadersList from '@/application/characters/list/CharactersHeadersList';

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

describe('CharactersHeadersList', () => {
  beforeEach(() => {
    useEntityTagsMock.mockReset();
    useQueryMock.mockReset();
    tagFilterSpy.mockReset();
    visibilityFilterSpy.mockReset();
    useApiKeyMock.mockReset();
    useApiKeyMock.mockReturnValue({ apiKey: null, isLoaded: true, hasApiKey: false, saveApiKey: vi.fn(), removeApiKey: vi.fn() });
  });

  it('hides the built-in character tag from the visible filter props', () => {
    useEntityTagsMock.mockReturnValue({ tags: [CharacterTag, 'sesja-a'], isLoading: false });
    useQueryMock.mockReturnValue({ data: [] });

    render(<CharactersHeadersList />);

    expect(tagFilterSpy).toHaveBeenCalled();

    const tagFilterProps = tagFilterSpy.mock.calls.at(-1)?.[0] as {
      availableTags: string[];
      includedTags: string[];
      excludedTags: string[];
    };

    expect(tagFilterProps.availableTags).toEqual(['sesja-a']);
    expect(tagFilterProps.includedTags).toEqual([]);
    expect(tagFilterProps.excludedTags).toEqual([]);
  });

  it('renders both favorite and main character buttons for each character card', () => {
    useEntityTagsMock.mockReturnValue({ tags: [], isLoading: false });
    useQueryMock.mockReturnValue({
      data: [
        {
          id: 'character-1',
          name: 'Geralt',
          shortName: 'Bialy Wilk',
          tags: ['character'],
        },
      ],
    });

    render(<CharactersHeadersList />);

    expect(screen.getByRole('button', { name: 'Favorite character-1' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Main character-1' })).toBeTruthy();
  });

  it('renders the calmer character card style with the short name', () => {
    useEntityTagsMock.mockReturnValue({ tags: [], isLoading: false });
    useQueryMock.mockReturnValue({
      data: [
        {
          id: 'character-1',
          name: 'Geralt',
          shortName: 'Bialy Wilk',
          tags: ['character'],
        },
      ],
    });

    render(<CharactersHeadersList />);

    expect(screen.getByText('Bialy Wilk')).toBeInTheDocument();

    const card = screen.getByText('Geralt').closest('[data-slot="card"]');

    expect(card).not.toBeNull();
    expect(card).toHaveClass('w-full');
    expect(card).toHaveClass('hover:bg-accent/40');
    expect(card).not.toHaveClass('bg-gradient-to-r');
  });

  it('includes the current API key in the characters query key, so switching keys triggers a refetch', () => {
    useEntityTagsMock.mockReturnValue({ tags: [], isLoading: false });
    useQueryMock.mockReturnValue({ data: [] });

    useApiKeyMock.mockReturnValue({ apiKey: null, isLoaded: true, hasApiKey: false, saveApiKey: vi.fn(), removeApiKey: vi.fn() });
    const { rerender } = render(<CharactersHeadersList />);
    const queryKeyWithoutApiKey = lastCharactersQueryKey();

    useApiKeyMock.mockReturnValue({ apiKey: 'ABC', isLoaded: true, hasApiKey: true, saveApiKey: vi.fn(), removeApiKey: vi.fn() });
    rerender(<CharactersHeadersList />);
    const queryKeyWithApiKey = lastCharactersQueryKey();

    expect(queryKeyWithApiKey).not.toEqual(queryKeyWithoutApiKey);
    expect(queryKeyWithApiKey).toContain('ABC');
  });

  it('disables the "mine only" visibility option when no API key is set', () => {
    useEntityTagsMock.mockReturnValue({ tags: [], isLoading: false });
    useQueryMock.mockReturnValue({ data: [] });
    useApiKeyMock.mockReturnValue({ apiKey: null, isLoaded: true, hasApiKey: false, saveApiKey: vi.fn(), removeApiKey: vi.fn() });

    render(<CharactersHeadersList />);

    expect(visibilityFilterSpy).toHaveBeenCalled();
    const props = visibilityFilterSpy.mock.calls.at(-1)?.[0] as { mineOnlyDisabled: boolean };
    expect(props.mineOnlyDisabled).toBe(true);
  });

  it('changing the visibility filter updates the characters query key', () => {
    useEntityTagsMock.mockReturnValue({ tags: [], isLoading: false });
    useQueryMock.mockReturnValue({ data: [] });
    useApiKeyMock.mockReturnValue({ apiKey: 'ABC', isLoaded: true, hasApiKey: true, saveApiKey: vi.fn(), removeApiKey: vi.fn() });

    render(<CharactersHeadersList />);
    const queryKeyBefore = lastCharactersQueryKey();

    fireEvent.click(screen.getByText('publicOnly'));
    const queryKeyAfter = lastCharactersQueryKey();

    expect(queryKeyAfter).not.toEqual(queryKeyBefore);
    expect(queryKeyAfter).toContain('publicOnly');
  });

  it('resets the visibility filter back to "all" once the API key is removed', () => {
    useEntityTagsMock.mockReturnValue({ tags: [], isLoading: false });
    useQueryMock.mockReturnValue({ data: [] });
    useApiKeyMock.mockReturnValue({ apiKey: 'ABC', isLoaded: true, hasApiKey: true, saveApiKey: vi.fn(), removeApiKey: vi.fn() });

    const { rerender } = render(<CharactersHeadersList />);

    fireEvent.click(screen.getByText('mineOnly'));
    expect(visibilityFilterSpy.mock.calls.at(-1)?.[0]).toMatchObject({ value: 'mineOnly' });

    useApiKeyMock.mockReturnValue({ apiKey: null, isLoaded: true, hasApiKey: false, saveApiKey: vi.fn(), removeApiKey: vi.fn() });
    rerender(<CharactersHeadersList />);

    expect(visibilityFilterSpy.mock.calls.at(-1)?.[0]).toMatchObject({ value: 'all' });
  });
});