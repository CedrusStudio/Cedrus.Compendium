import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { Character } from '@/domain/characters/Character';

vi.mock('@/common/components/ui/badge', () => ({
  Badge: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock('@/common/components/ui/separator', () => ({
  Separator: () => <div data-testid="separator" />,
}));

vi.mock('@/application/characters/details/PerksList', () => ({
  __esModule: true,
  default: () => <div data-testid="perks-list" />,
}));

vi.mock('@/common/components/tags/TagsView', () => ({
  __esModule: true,
  default: () => <div data-testid="tags-view" />,
}));

vi.mock('@/common/components/ui/button', () => ({
  Button: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock('next/link', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => <a>{children}</a>,
}));

vi.mock('@/common/translations', () => ({
  displayedText: {
    race: 'race',
  },
}));

import DetailsView from '../DetailsView';

const character = {
  id: 'character-1',
  name: 'Geralt',
  shortName: 'Ger',
  description: 'Pierwsza linia\nDruga linia',
  tags: [],
  perks: [],
  race: null,
} as unknown as Character;

describe('DetailsView', () => {
  it('renders the character description with preserved line breaks', () => {
    render(<DetailsView character={character} />);

    const description = screen.getByText(
      (_content, element) => element?.tagName === 'P' && element.textContent === 'Pierwsza linia\nDruga linia'
    );

    expect(description).toHaveClass('whitespace-pre-wrap');
    expect(description).toHaveClass('break-words');
  });
});