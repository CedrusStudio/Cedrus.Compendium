import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useForm } from 'react-hook-form';
import type { DetailsDto } from '@/persistence/schemas/characters/headerSchema';
import type { Race } from '@/domain/Race';

const useQueryMock = vi.fn();

vi.mock('@tanstack/react-query', () => ({
  useQuery: (options: unknown) => useQueryMock(options),
}));

vi.mock('use-debounce', () => ({
  useDebounce: (value: string) => [value],
}));

vi.mock('@/common/translations', () => ({
  displayedText: {
    race: 'race',
    searchRaces: 'Search races',
    noRacesFound: 'No races found',
  },
}));

vi.mock('@/common/components/ui/label', () => ({
  Label: ({ children, ...props }: React.ComponentProps<'label'>) => <label {...props}>{children}</label>,
}));

vi.mock('@/common/components/ui/button', () => ({
  Button: ({ children, type = 'button', ...props }: React.ComponentProps<'button'>) => (
    <button type={type} {...props}>{children}</button>
  ),
}));

vi.mock('@/common/components/ui/badge', () => ({
  Badge: ({ children, ...props }: React.ComponentProps<'div'>) => <div {...props}>{children}</div>,
}));

vi.mock('@/common/components/ui/input', () => ({
  Input: (props: React.ComponentProps<'input'>) => <input {...props} />,
}));

vi.mock('@/common/icons', () => ({
  deleteIcon: <span>delete</span>,
}));

vi.mock('lucide-react', () => ({
  Search: () => <span>search</span>,
}));

vi.mock('@/common/hooks/useEntityTags', () => ({
  useEntityTags: () => ({ tags: [], isLoading: false }),
}));

vi.mock('@/common/components/filters/TagFilter', () => ({
  __esModule: true,
  default: () => <div data-testid="tag-filter" />,
}));

vi.mock('@/application/characters/edit/details/RaceCreateSheet', () => ({
  __esModule: true,
  default: () => <div data-testid="race-create-sheet" />,
}));

vi.mock('@/persistence/cacheKeys', () => ({
  createKeysetSearchRacesKey: (search: string) => ['races', search],
}));

vi.mock('@/infrastructure/searchQueries/races/createRaceKeysetQuery', () => ({
  createRaceKeysetQuery: vi.fn(),
}));

vi.mock('@/infrastructure/clients/searchClient', () => ({
  __esModule: true,
  default: {
    search: vi.fn(),
  },
}));

import RaceSelector from '../RaceSelector';

function Harness({ currentRace = null }: { currentRace?: Race | null })
{
  const form = useForm<DetailsDto>({
    defaultValues: {
      name: 'Geralt',
      shortName: 'Ger',
      tags: [],
      description: '',
      perks: [],
      raceId: currentRace?.id ?? null,
    },
  });

  return <RaceSelector control={form.control} currentRace={currentRace} />;
}

describe('RaceSelector', () => {
  beforeEach(() => {
    useQueryMock.mockReset();
    useQueryMock.mockImplementation(({ queryKey }: { queryKey: [string, string] }) => ({
      data: queryKey[1] === 'elf'
        ? [{ id: 'race-elf', name: 'Elf', description: 'Forest scout', tags: ['forest'] }]
        : [],
    }));
  });

  it('shows the current race even when it is outside the current search results', () => {
    render(<Harness currentRace={{
      id: 'race-elf',
      name: 'Elf',
      description: 'Forest scout',
      tags: ['forest'],
      strengthModifier: 0,
      dexterityModifier: 0,
      constitutionModifier: 0,
      mindModifier: 0,
      charismaModifier: 0,
      spellbornModifier: 0,
    }} />);

    expect(screen.getByText('Elf')).toBeInTheDocument();
    expect(screen.queryByText('Brak wybranej rasy')).not.toBeInTheDocument();
  });

  it('keeps the selected race visible after the search results reset', async () => {
    const user = userEvent.setup();

    render(<Harness />);

    await user.click(screen.getByRole('button', { name: 'searchWybierz rasę' }));
    await user.type(screen.getByPlaceholderText('Search races'), 'elf');

    await user.click(await screen.findByRole('button', { name: /Elf/i }));

    await waitFor(() => expect(screen.getByText('Elf')).toBeInTheDocument());
    expect(screen.queryByText('Brak wybranej rasy')).not.toBeInTheDocument();
  });
});