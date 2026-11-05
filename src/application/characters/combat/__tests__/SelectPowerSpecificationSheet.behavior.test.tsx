import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, expect, it, vi } from 'vitest';
import { DEFAULT_PAGE_SIZE, emptyUlid } from '@/common/global/pagination';
import { CreateDefaultPowerSpecification, type PowerSpecification } from '@/domain/characters/combat/Power';
import searchClient from '@/infrastructure/clients/searchClient';
import { SelectPowerSpecificationSheet } from '../SelectPowerSpecificationSheet';

vi.mock('@/infrastructure/clients/searchClient', () => ({ default: { search: vi.fn() } }));
vi.mock('@/common/hooks/useEntityTags', () => ({ useEntityTags: () => ({ tags: [], isLoading: false }) }));
vi.mock('use-debounce', () => ({ useDebounce: (value: string) => [value] }));
vi.mock('@/common/components/lists/ListHeader', async () => ({
  default: (await import('@/__tests__/fixtures/compendiumList')).ListControls,
}));
vi.mock('@/common/components/WithScroll', async () => ({
  WithScroll: (await import('@/__tests__/fixtures/compendiumList')).Results,
}));

const search = vi.mocked(searchClient.search<PowerSpecification[]>);
beforeEach(() => search.mockReset());

function spec(id: string, name: string)
{
  return { ...CreateDefaultPowerSpecification(), id, name };
}

function renderSheet(currentSpecificationId?: string)
{
  const onSelect = vi.fn();
  const onOpenChange = vi.fn();
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={queryClient}>
      <SelectPowerSpecificationSheet open onOpenChange={onOpenChange} onSelect={onSelect} currentSpecificationId={currentSpecificationId} />
    </QueryClientProvider>,
  );
  return { onSelect, onOpenChange };
}

it('marks and confirms the current specification, and selects another on click', async () => {
  const current = { ...spec('current', 'Lód'), tags: ['mróz'] };
  const next = { ...spec('next', 'Ogień'), description: 'Gorąca fala' };
  search.mockResolvedValue([current, next]);
  const { onSelect, onOpenChange } = renderSheet(current.id);
  expect(await screen.findByText('Posiadane')).toBeVisible();
  expect(screen.getByText('mróz')).toBeVisible();
  expect(screen.getByText(next.description)).toBeVisible();
  fireEvent.click(screen.getByRole('button', { name: 'Wybierz Specyfikację' }));
  expect(onSelect).toHaveBeenLastCalledWith(current);
  expect(onOpenChange).toHaveBeenLastCalledWith(false);
  fireEvent.click(screen.getByRole('heading', { name: next.name }));
  expect(onSelect).toHaveBeenLastCalledWith(next);
  expect(onOpenChange).toHaveBeenCalledTimes(2);
});

it('advances by the last result and clears earlier pages when the filters change', async () => {
  const first = Array.from({ length: DEFAULT_PAGE_SIZE }, (_, i) => spec('spec-' + i, 'Specyfikacja ' + i));
  const last = spec('last', 'Inna moc');
  const filtered = spec('filtered', 'Lodowa moc');
  search.mockImplementation(async query => {
    if (query?.search?.name === 'Lodowa') return [filtered];
    const pagination = query?.pagination;
    return pagination && 'cursor' in pagination && pagination.cursor === first.at(-1)?.id ? [last] : first;
  });
  renderSheet();
  expect(screen.getByRole('button', { name: 'Wybierz Specyfikację' })).toBeDisabled();
  expect(await screen.findByText(first[0].name)).toBeVisible();
  fireEvent.click(screen.getByRole('button', { name: 'Load next page' }));
  expect(await screen.findByText(last.name)).toBeVisible();
  expect(screen.getByText(first[0].name)).toBeVisible();
  expect(screen.queryByRole('button', { name: 'Load next page' })).not.toBeInTheDocument();
  expect(search).toHaveBeenLastCalledWith(expect.objectContaining({
    pagination: { cursor: first.at(-1)?.id, pageSize: DEFAULT_PAGE_SIZE },
  }));

  fireEvent.change(screen.getByLabelText('Search by name'), { target: { value: 'Lodowa' } });
  fireEvent.click(screen.getByRole('button', { name: 'Include combat' }));
  fireEvent.click(screen.getByRole('button', { name: 'Exclude ranged' }));
  expect(await screen.findByText(filtered.name)).toBeVisible();
  expect(screen.queryByText(last.name)).not.toBeInTheDocument();
  await waitFor(() => expect(search).toHaveBeenLastCalledWith(expect.objectContaining({
    pagination: { cursor: emptyUlid, pageSize: DEFAULT_PAGE_SIZE },
    search: expect.objectContaining({ name: 'Lodowa', tags: ['walka'] }),
    exclude: { tags: ['dystans'] },
  })));
});
