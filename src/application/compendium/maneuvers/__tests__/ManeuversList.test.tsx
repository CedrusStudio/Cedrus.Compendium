import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { userEvent } from '@/__tests__/utils/testUtils';

import { facetFilter, requirementFilter } from '@/__tests__/fixtures/compendiumList';
import searchClient from '@/infrastructure/clients/searchClient';

import { DEFAULT_PAGE_SIZE } from '@/common/global/pagination';
import type { OwnedFilter } from '@/application/compendium/characterOwnership';
import { CreateDefaultManeuver, type Maneuver } from '@/domain/characters/combat/Maneuver';

const ownership = vi.hoisted(() => ({ filter: null as OwnedFilter | null, key: '' }));

vi.mock('@/application/compendium/character-scope/CharacterOwnedFilter', () => ({
  CharacterOwnedFilter: () => null,
  useCharacterOwnedFilter: () => ownership,
}));

vi.mock('@/application/common/requirements/RequirementFilter', async () => ({
  default: (await import('@/__tests__/fixtures/compendiumList')).RequirementControl,
}));

vi.mock('@/infrastructure/clients/maneuversClient', () => ({
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
  default: () => <div data-testid="add-maneuver-sheet" />
}));

vi.mock('@/common/components/lists/GroupedItemsList', async () => ({
  default: (await import('@/__tests__/fixtures/compendiumList')).Results,
}));

vi.mock('@/application/compendium/maneuvers/ManeuverView', () => ({
  default: ({ maneuver, onDelete }: { maneuver: { id: string; name: string }; onDelete: (id: string) => void }) => (
    <div data-testid={`maneuver-${maneuver.id}`}>
      {maneuver.name}
      <button type="button" onClick={() => onDelete(maneuver.id)}>Remove {maneuver.name}</button>
    </div>
  ),
}));

import ManeuversList from '@/application/compendium/maneuvers/ManeuversList';

function createTestQueryClient()
{
  return new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
}

describe('ManeuversList', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(searchClient.search).mockResolvedValue([]);
    localStorage.clear();
    ownership.key = '';
    ownership.filter = null;
  });


  it.each(['flat', 'grouped'])('merges overlapping pages in the %s view and resets them on a group search', async (mode) => {
    const { default: searchClient } = await import('@/infrastructure/clients/searchClient');
    const search = vi.mocked(searchClient.search<Maneuver[]>);
    const first = Array.from({ length: DEFAULT_PAGE_SIZE }, (_, i) => ({
      ...CreateDefaultManeuver(), id: 'entry-' + i, name: 'Original entry ' + i,
    }));
    const next = [{ ...first[0], name: 'Updated entry 0' }, { ...first[1], id: 'later-entry', name: 'Next page entry' }];
    const narrowed = [{ ...first[0], id: 'group-entry', name: 'Zasłona' }];
    const nameFilter = mode === 'grouped' ? { anyOf: ['Zasłona'] } : 'Zasłona';
    search.mockImplementation(async query => {
      const name = query?.search?.name;
      if (name === 'Zasłona' || (typeof name === 'object' && name !== null && 'anyOf' in name && name.anyOf.includes('Zasłona'))) return narrowed;
      const pagination = query?.pagination;
      return pagination && 'pageNumber' in pagination && pagination.pageNumber === 2 ? next : first;
    });
    const queryClient = createTestQueryClient();
    render(<QueryClientProvider client={queryClient}><ManeuversList /></QueryClientProvider>);
    expect(await screen.findByText('Original entry 0')).toBeVisible();
    if (mode === 'grouped') {
      fireEvent.click(screen.getByTitle('Switch to grouped view'));
      expect(localStorage.getItem('maneuvers-grouped-view')).toBe('true');
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
      search: expect.objectContaining({ name: nameFilter }),
    }));
    if (mode === 'grouped') {
      const calls = search.mock.calls.length;
      fireEvent.click(results.getByRole('button', { name: 'Search this group' }));
      expect(results.getByText('Zasłona')).toBeVisible();
      expect(search).toHaveBeenCalledTimes(calls);
      fireEvent.change(screen.getByLabelText('Search by name'), { target: { value: '' } });
      expect(await results.findByText('Original entry 1')).toBeVisible();
    }
  });

  it('composes the filters and clears displayed results for a character with no owned entries', async () => {
    const { default: searchClient } = await import('@/infrastructure/clients/searchClient');
    const search = vi.mocked(searchClient.search);
    const item = { ...CreateDefaultManeuver(), id: 'owned-entry', name: 'Owned entry' };
    search.mockResolvedValue([item]);
    ownership.filter = { values: [item.id] };
    ownership.key = item.id;
    const queryClient = createTestQueryClient();
    const view = () => <QueryClientProvider client={queryClient}><ManeuversList /></QueryClientProvider>;
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

  it('shows unassessed maneuvers and hides both authored and intentionally unsupported entries', async () => {
    const { default: searchClient } = await import('@/infrastructure/clients/searchClient');
    const base = CreateDefaultManeuver();
    vi.mocked(searchClient.search).mockResolvedValue([
      { ...base, id: 'unassessed', name: 'Needs effects' },
      { ...base, id: 'supported', name: 'Has effects', effects: [{ type: 'push', distance: 1 }] },
      { ...base, id: 'unsupported', name: 'Unsupported', simulatable: false },
    ]);
    render(<QueryClientProvider client={createTestQueryClient()}><ManeuversList /></QueryClientProvider>);
    expect(await screen.findByText('Has effects')).toBeVisible();
    fireEvent.click(screen.getByTitle('Tylko wymagające efektów (z załadowanych)'));
    expect(screen.getByText('Needs effects')).toBeVisible();
    expect(screen.queryByText('Has effects')).not.toBeInTheDocument();
    expect(screen.queryByText('Unsupported')).not.toBeInTheDocument();
    fireEvent.click(screen.getByTitle('Pokaż wszystkie manewry'));
    expect(screen.getByText('Has effects')).toBeVisible();
    expect(screen.getByText('Unsupported')).toBeVisible();
  });

  it('sends selected cast times into the maneuver search payload', async () => {
    const { default: searchClient } = await import('@/infrastructure/clients/searchClient');
    const user = userEvent.setup();

    const queryClient = createTestQueryClient();

    render(
      <QueryClientProvider client={queryClient}>
        <ManeuversList />
      </QueryClientProvider>
    );

    await waitFor(() => expect(searchClient.search).toHaveBeenCalled());

    await user.click(screen.getByRole('button', { name: 'Natychmiastowa' }));

    await waitFor(() =>
      expect(searchClient.search).toHaveBeenLastCalledWith(
        expect.objectContaining({
          search: expect.objectContaining({
            castTime: { anyOf: ['Natychmiastowa'] },
          }),
        })
      )
    );
  });
});
