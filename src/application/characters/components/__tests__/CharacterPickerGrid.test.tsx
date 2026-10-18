import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderWithProviders, screen, userEvent } from '@/__tests__/utils/testUtils';
import CharacterPickerGrid from '@/application/characters/components/CharacterPickerGrid';

vi.mock('@/common/translations', () => ({
  displayedText: {
    no_characters_found: 'Nie znaleziono postaci',
    searchByName: 'Szukaj po nazwie',
    compendium_load_more: 'Pokaż więcej',
  }
}));

vi.mock('@/common/hooks/useEntityTags', () => ({
  useEntityTags: () => ({ tags: [], isLoading: false })
}));

vi.mock('use-debounce', () => ({
  useDebounce: (value: string) => [value],
}));

vi.mock('@/common/components/lists/ListHeader', () => ({
  default: ({ children }: { children: React.ReactNode }) => <div data-testid="list-header">{children}</div>
}));

type MockCharacterSummary = { id: string; name: string; shortName: string; tags: string[] };

const defaultCharacters: MockCharacterSummary[] = [
  { id: 'wojownik', name: 'Wojownik', shortName: 'Woj', tags: [] },
  { id: 'rycerz-miecznik', name: 'Rycerz Miecznik', shortName: 'RM', tags: [] },
  { id: 'mag-ognia', name: 'Mag Ognia', shortName: 'MO', tags: [] },
];

let mockCharacters: MockCharacterSummary[] = defaultCharacters;
let mockSecondPage: MockCharacterSummary[] = [];

vi.mock('@/application/characters/hooks/useSearchCharactersSummary', () => ({
  useSearchCharactersSummary: (_search: string, _cursor: string, _tags: string[], _size: number, _excluded: string[], pageNumber: number) => ({ characters: pageNumber === 2 ? mockSecondPage : mockCharacters })
}));

describe('CharacterPickerGrid', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCharacters = defaultCharacters;
    mockSecondPage = [];
  });

  it('renders every returned character as a selectable card', () => {
    renderWithProviders(<CharacterPickerGrid onSelectCharacter={vi.fn()} />);

    expect(screen.getByText('Wojownik')).toBeTruthy();
    expect(screen.getByText('Rycerz Miecznik')).toBeTruthy();
    expect(screen.getByText('Mag Ognia')).toBeTruthy();
  });

  it('excludes the given character id from the results (e.g. the character currently being edited)', () => {
    renderWithProviders(<CharacterPickerGrid onSelectCharacter={vi.fn()} excludeCharacterId="rycerz-miecznik" />);

    expect(screen.getByText('Wojownik')).toBeTruthy();
    expect(screen.queryByText('Rycerz Miecznik')).toBeNull();
  });

  it('calls onSelectCharacter with the clicked character id', async () => {
    const user = userEvent.setup();
    const onSelectCharacter = vi.fn();
    renderWithProviders(<CharacterPickerGrid onSelectCharacter={onSelectCharacter} />);

    await user.click(screen.getByText('Rycerz Miecznik'));

    expect(onSelectCharacter).toHaveBeenCalledWith('rycerz-miecznik');
  });

  it('shows a not-found message when there are no characters to pick from', () => {
    mockCharacters = [];
    renderWithProviders(<CharacterPickerGrid onSelectCharacter={vi.fn()} />);

    expect(screen.getByText('Nie znaleziono postaci')).toBeTruthy();
  });

  it('loads another page and supports keyboard selection outside the first page', async () => {
    mockCharacters = Array.from({ length: 10 }, (_, index) => ({ id: String(index), name: `Postać ${index}`, shortName: String(index), tags: [] }));
    mockSecondPage = [{ id: 'last', name: 'Ostatnia postać', shortName: 'Last', tags: [] }];
    const user = userEvent.setup();
    const onSelectCharacter = vi.fn();
    renderWithProviders(<CharacterPickerGrid onSelectCharacter={onSelectCharacter} />);
    await user.click(screen.getByRole('button', { name: 'Pokaż więcej' }));
    const last = await screen.findByRole('button', { name: /Ostatnia postać/ });
    last.focus();
    await user.keyboard('{Enter}');
    expect(onSelectCharacter).toHaveBeenCalledWith('last');
    expect(screen.getByText('Postać 0')).toBeInTheDocument();
  });
});
