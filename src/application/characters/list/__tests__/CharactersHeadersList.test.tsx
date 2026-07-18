import React from 'react';
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CharacterTag } from '@/domain/Tag';

const useQueryMock = vi.fn();
const useEntityTagsMock = vi.fn();
const useDispatchMock = vi.fn();
const useApiKeyMock = vi.fn();
const tagFilterSpy = vi.fn();

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

describe('CharactersHeadersList', () => {
  beforeEach(() => {
    useEntityTagsMock.mockReset();
    useQueryMock.mockReset();
    tagFilterSpy.mockReset();
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
    const queryKeyWithoutApiKey = useQueryMock.mock.calls.at(-1)?.[0]?.queryKey;

    useApiKeyMock.mockReturnValue({ apiKey: 'ABC', isLoaded: true, hasApiKey: true, saveApiKey: vi.fn(), removeApiKey: vi.fn() });
    rerender(<CharactersHeadersList />);
    const queryKeyWithApiKey = useQueryMock.mock.calls.at(-1)?.[0]?.queryKey;

    expect(queryKeyWithApiKey).not.toEqual(queryKeyWithoutApiKey);
    expect(queryKeyWithApiKey).toContain('ABC');
  });
});