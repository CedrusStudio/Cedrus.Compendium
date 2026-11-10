import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { userEvent } from '@/__tests__/utils/testUtils';

 import { facetFilter, requirementFilter } from '@/__tests__/fixtures/compendiumList';
import searchClient from '@/infrastructure/clients/searchClient';

import { DEFAULT_PAGE_SIZE } from '@/common/global/pagination';
import type { OwnedFilter } from '@/application/compendium/characterOwnership';
import { CreateDefaultSpell, type Spell } from '@/domain/characters/combat/Power';

const ownership = vi.hoisted(() => ({ filter: null as OwnedFilter | null, key: '' }));

vi.mock('@/application/compendium/character-scope/CharacterOwnedFilter', () => ({
  CharacterOwnedFilter: () => null,
  useCharacterOwnedFilter: () => ownership,
}));

vi.mock('@/application/common/requirements/RequirementFilter', async () => ({
  default: (await import('@/__tests__/fixtures/compendiumList')).RequirementControl,
}));

vi.mock('@/infrastructure/clients/spellsClient', () => ({
  default: { add: vi.fn(), update: vi.fn(), delete: vi.fn() }
}));

vi.mock('@/infrastructure/clients/searchClient', () => ({
  default: { search: vi.fn().mockResolvedValue([]) }
}));

vi.mock('@/common/hooks/useEntityTags', () => ({
  useEntityTags: () => ({ tags: [], isLoading: false, error: null })
}));

vi.mock('@/infrastructure/hooks/useFormMutation', () => ({
  useFormMutation: () => ({ handleSubmit: vi.fn(), isPending: false })
}));

vi.mock('use-debounce', () => ({
  useDebounce: (value: string) => [value],
}));

vi.mock('@/common/components/WithScroll', async () => ({
  WithScroll: (await import('@/__tests__/fixtures/compendiumList')).Results,
}));

vi.mock('react-hook-form', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-hook-form')>();
  return {
    ...actual,
    useForm: () => ({
      handleSubmit: vi.fn(),
      control: {},
      formState: { errors: {} },
      reset: vi.fn(),
    }),
  };
});

vi.mock('@/ui/form', () => ({
  Form: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock('@/common/components/lists/ListHeader', async () => ({
  default: (await import('@/__tests__/fixtures/compendiumList')).ListControls,
}));

vi.mock('@/application/common/PerkableAddSheet', () => ({
  default: () => <div data-testid="add-spell-sheet" />
}));

vi.mock('@/common/components/lists/GroupedItemsList', async () => ({
  default: (await import('@/__tests__/fixtures/compendiumList')).Results,
}));

vi.mock('@/application/compendium/spells/SpellView', () => ({
  default: ({ spell, onDelete }: { spell: { id: string; name: string }; onDelete: (id: string) => void }) => (
    <div data-testid={`spell-${spell.id}`}>
      {spell.name}
      <button type="button" onClick={() => onDelete(spell.id)}>Remove {spell.name}</button>
    </div>
  ),
}));

import SpellsList from '@/application/compendium/spells/SpellsList';

function createTestQueryClient()
{
  return new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
}

describe('SpellsList', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(searchClient.search).mockResolvedValue([]);
    localStorage.clear();
    ownership.key = '';
    ownership.filter = null;
   });


  it.each(['flat', 'grouped'])('merges overlapping pages in the %s view and resets them on a group search', async (mode) => {
    const { default: searchClient } = await import('@/infrastructure/clients/searchClient');
    const search = vi.mocked(searchClient.search<Spell[]>);
    const first = Array.from({ length: DEFAULT_PAGE_SIZE }, (_, i) => ({
      ...CreateDefaultSpell(), id: 'entry-' + i, name: 'Original entry ' + i,
    }));
    const next = [{ ...first[0], name: 'Updated entry 0' }, { ...first[1], id: 'later-entry', name: 'Next page entry' }];
    const narrowed = [{ ...first[0], id: 'group-entry', name: 'Zasłona' }];
    search.mockImplementation(async query => {
      if (query?.search?.name === 'Zasłona') return narrowed;
      const pagination = query?.pagination;
      return pagination && 'pageNumber' in pagination && pagination.pageNumber === 2 ? next : first;
    });
    const queryClient = createTestQueryClient();
    render(<QueryClientProvider client={queryClient}><SpellsList /></QueryClientProvider>);
    expect(await screen.findByText('Original entry 0')).toBeVisible();
    if (mode === 'grouped') {
      fireEvent.click(screen.getByTitle('Switch to grouped view'));
      expect(localStorage.getItem('spells-grouped-view')).toBe('true');
    }
    const results = within(screen.getByRole('region', { name: mode === 'grouped' ? 'Grouped results' : 'Flat results' }));
    fireEvent.click(results.getByRole('button', { name: 'Load next page' }));
    expect(await results.findByText('Next page entry')).toBeVisible();
    expect(results.getAllByText('Updated entry 0')).toHaveLength(1);
    expect(results.getByText('Original entry 1')).toBeVisible();
    expect(results.queryByText('Original entry 0')).not.toBeInTheDocument();
    expect(results.queryByRole('button', { name: 'Load next page' })).not.toBeInTheDocument();

    fireEvent.click(results.getByRole('button', { name: 'Remove Next page entry' }));
    expect(results.queryByText('Next page entry')).not.toBeInTheDocument();

    if (mode === 'grouped') fireEvent.click(results.getByRole('button', { name: 'Search this group' }));
    else fireEvent.change(screen.getByLabelText('Search by name'), { target: { value: 'Zasłona' } });
    expect(await results.findByText('Zasłona')).toBeVisible();
    expect(results.queryByText('Original entry 1')).not.toBeInTheDocument();
    expect(search).toHaveBeenLastCalledWith(expect.objectContaining({
      pagination: { pageNumber: 1, pageSize: DEFAULT_PAGE_SIZE },
      search: expect.objectContaining({ name: 'Zasłona' }),
    }));
  });

  it('composes the filters and clears displayed results for a character with no owned entries', async () => {
    const { default: searchClient } = await import('@/infrastructure/clients/searchClient');
    const search = vi.mocked(searchClient.search);
    const item = { ...CreateDefaultSpell(), id: 'owned-entry', name: 'Owned entry' };
    search.mockResolvedValue([item]);
    ownership.filter = { values: [item.id] };
    ownership.key = item.id;
    const queryClient = createTestQueryClient();
    const view = () => <QueryClientProvider client={queryClient}><SpellsList /></QueryClientProvider>;
    const { rerender } = render(view());
    expect(await screen.findByText(item.name)).toBeVisible();

    fireEvent.change(screen.getByLabelText('Filter by grade'), { target: { value: '7' } });
    fireEvent.click(screen.getByRole('button', { name: 'Include combat' }));
    fireEvent.click(screen.getByRole('button', { name: 'Exclude ranged' }));
    fireEvent.click(screen.getByRole('button', { name: 'Filter defense facet' }));
    fireEvent.click(screen.getByRole('button', { name: 'Filter training requirement' }));
    await waitFor(() => expect(search).toHaveBeenLastCalledWith(expect.objectContaining({
      search: expect.objectContaining({ id: { anyOf: [item.id] }, grade: 7, tags: ['walka'] }),
      exclude: { tags: ['dystans'] },
      requirementFilters: [requirementFilter],
      tagFacetFilters: [facetFilter],
    })));

    ownership.filter = { values: [] };
    ownership.key = 'empty-character';
    const callsBeforeScopeChange = search.mock.calls.length;
    rerender(view());
    await waitFor(() => expect(screen.queryByText(item.name)).not.toBeInTheDocument());
    expect(search).toHaveBeenCalledTimes(callsBeforeScopeChange);
  });

  it('sends selected cast times into the spell search payload', async () => {
    const { default: searchClient } = await import('@/infrastructure/clients/searchClient');
    const user = userEvent.setup();

    const queryClient = createTestQueryClient();

    render(
      <QueryClientProvider client={queryClient}>
        <SpellsList />
      </QueryClientProvider>
    );

    await waitFor(() => expect(searchClient.search).toHaveBeenCalled());

    await user.click(screen.getByRole('button', { name: 'Standardowa' }));

    await waitFor(() =>
      expect(searchClient.search).toHaveBeenLastCalledWith(
        expect.objectContaining({
          search: expect.objectContaining({
            castTime: { anyOf: ['Standardowa'] },
          }),
        })
      )
    );
  });

  it('sends the selected grade into the spell search payload', async () => {
    const { default: searchClient } = await import('@/infrastructure/clients/searchClient');

    const queryClient = createTestQueryClient();

    render(
      <QueryClientProvider client={queryClient}>
        <SpellsList />
      </QueryClientProvider>
    );

    await waitFor(() => expect(searchClient.search).toHaveBeenCalled());

    fireEvent.change(screen.getByLabelText('Filter by grade'), { target: { value: '7' } });

    await waitFor(() =>
      expect(searchClient.search).toHaveBeenLastCalledWith(
        expect.objectContaining({
          search: expect.objectContaining({
            grade: 7,
          }),
        })
      )
    );
  });
});
