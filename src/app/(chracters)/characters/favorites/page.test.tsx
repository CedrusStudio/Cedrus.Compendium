import React from 'react';
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const usePersonalizationMock = vi.fn();
const useFavoriteCharactersMock = vi.fn();

vi.mock('@/common/hooks/usePersonalization', () => ({
  usePersonalization: () => usePersonalizationMock(),
}));

vi.mock('@/application/personalization/useFavoriteCharacters', () => ({
  useFavoriteCharacters: () => useFavoriteCharactersMock(),
}));

vi.mock('@/application/personalization/FavoriteCharacterButton', () => ({
  default: ({ characterId }: { characterId: string }) => <button type="button">Favorite {characterId}</button>,
}));

vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string; children: React.ReactNode }) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

import FavoriteCharactersPage from '@/app/(chracters)/characters/favorites/page';
import { createEmptyProfile } from '@/persistence/slices/personalizationSlice';

describe('FavoriteCharactersPage', () => {
  beforeEach(() => {
    usePersonalizationMock.mockReset();
    useFavoriteCharactersMock.mockReset();
  });

  it('renders the main character first and marks it', () => {
    usePersonalizationMock.mockReturnValue({
      hasApiKey: true,
      isLoaded: true,
      profile: {
        ...createEmptyProfile(),
        favoriteCharacterIds: ['character-2', 'character-1'],
        mainCharacterId: 'character-1',
      },
    });

    useFavoriteCharactersMock.mockReturnValue({
      isLoading: false,
      favoriteCharacters: [
        { id: 'character-2', name: 'Beta', shortName: 'B' },
        { id: 'character-1', name: 'Alpha', shortName: 'A' },
      ],
    });

    render(<FavoriteCharactersPage />);

    const headings = screen.getAllByRole('heading', { level: 2 });

    expect(headings[0]).toHaveTextContent('Alpha');
    expect(headings[1]).toHaveTextContent('Beta');
    expect(screen.getByTitle('Główna postać Alpha')).toBeTruthy();
  });
});