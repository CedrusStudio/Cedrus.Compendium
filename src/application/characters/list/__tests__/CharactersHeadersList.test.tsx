import React from 'react';
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const useQueryMock = vi.fn();
const useEntityTagsMock = vi.fn();
const useDispatchMock = vi.fn();

vi.mock('@tanstack/react-query', () => ({
  useQuery: (...args: unknown[]) => useQueryMock(...args),
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
  default: () => <div>Tag filter</div>,
}));

vi.mock('@/application/personalization/PersonalizedQuickTags', () => ({
  default: () => <div>Quick tags</div>,
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
  });

  it('renders both favorite and main character buttons for each character card', () => {
    useEntityTagsMock.mockReturnValue({ tags: [], isLoading: false });
    useQueryMock.mockReturnValue({
      data: [
        {
          id: 'character-1',
          name: 'Geralt',
          tags: ['character'],
        },
      ],
    });

    render(<CharactersHeadersList />);

    expect(screen.getByRole('button', { name: 'Favorite character-1' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Main character-1' })).toBeTruthy();
  });
});