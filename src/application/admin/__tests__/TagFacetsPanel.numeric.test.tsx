import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, expect, it, vi } from 'vitest';
import { TagFacetError } from '@/infrastructure/clients/tagFacetsClient';

const { getLayer, upsertFacet, deleteFacet, upsertDefinition, deleteDefinition } = vi.hoisted(() => ({
  getLayer: vi.fn(),
  upsertFacet: vi.fn(),
  deleteFacet: vi.fn(),
  upsertDefinition: vi.fn(),
  deleteDefinition: vi.fn(),
}));
vi.mock('@/infrastructure/clients/tagFacetsClient', () => ({
  TagFacetError: class extends Error {},
  default: {
    getLayer,
    upsertDefinition,
    deleteDefinition,
    getDrift: async () => ({ undefinedTags: [], unusedDefinitions: [], deadFacetEntities: [], partialCoverage: [], ineffectiveAssignments: [], tagEntities: {} }),
    upsertFacet,
    deleteFacet,
  },
}));
import TagFacetsPanel from '../TagFacetsPanel';

beforeEach(() => {
  getLayer.mockReset().mockResolvedValue({ facets: [{ key: 'role', label: 'Rola', order: 1, entities: ['maneuvers'], selectionMode: 'multi', supportsNone: true }], definitions: [], tagEntities: {} });
  upsertDefinition.mockReset().mockResolvedValue(undefined);
  deleteDefinition.mockReset().mockResolvedValue(undefined);
  upsertFacet.mockReset().mockResolvedValue(undefined);
  deleteFacet.mockReset().mockResolvedValue(undefined);
});

function renderPanel()
{
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={queryClient}><TagFacetsPanel /></QueryClientProvider>);
}

it('requires an explicit category order instead of restoring the previous number', async () => {
  renderPanel();
  fireEvent.click(await screen.findByRole('button', { name: 'Edytuj' }));
  const order = screen.getByPlaceholderText('kolejność');
  fireEvent.change(order, { target: { value: '' } });
  fireEvent.click(screen.getByRole('button', { name: 'Zapisz' }));
  expect(upsertFacet).not.toHaveBeenCalled();
  expect(screen.getByRole('alert')).toHaveTextContent('Uzupełnij pole');
  fireEvent.change(order, { target: { value: '0' } });
  fireEvent.click(screen.getByRole('button', { name: 'Zapisz' }));
  await waitFor(() => expect(upsertFacet).toHaveBeenCalledWith(expect.objectContaining({ order: 0 })));
});

it('creates a category with its selected scope and leaves the form open after a rejected save', async () => {
  upsertFacet.mockRejectedValueOnce(new TagFacetError('Ta kategoria już istnieje.'));
  renderPanel();

  fireEvent.click(await screen.findByRole('button', { name: 'Dodaj kategorię' }));
  const create = screen.getByRole('button', { name: 'Utwórz' });
  expect(create).toBeDisabled();

  const key = screen.getByPlaceholderText('klucz (np. szkoła-magii)');
  fireEvent.change(key, { target: { value: '  szkoła-magii  ' } });
  expect(create).toBeDisabled();
  fireEvent.click(screen.getByRole('checkbox', { name: 'Manewry' }));
  fireEvent.click(screen.getByRole('checkbox', { name: 'Zaklęcia' }));
  fireEvent.click(screen.getByRole('checkbox', { name: 'Manewry' }));
  fireEvent.click(screen.getByRole('checkbox', { name: 'tylko jedna wartość naraz' }));
  fireEvent.click(screen.getByRole('checkbox', { name: /oferuj/ }));
  fireEvent.click(create);

  expect(await screen.findByText('Ta kategoria już istnieje.')).toBeVisible();
  expect(key).toHaveValue('  szkoła-magii  ');
  fireEvent.click(create);

  await waitFor(() => expect(upsertFacet).toHaveBeenLastCalledWith({
    resource: 'facet',
    action: 'upsert',
    key: 'szkoła-magii',
    label: 'szkoła-magii',
    order: 99,
    selectionMode: 'single',
    supportsNone: false,
    entities: ['spells'],
  }));
  expect(await screen.findByRole('button', { name: 'Dodaj kategorię' })).toBeVisible();
  expect(screen.queryByText('Ta kategoria już istnieje.')).not.toBeInTheDocument();
});

it('deletes an empty category only after explicit confirmation', async () => {
  renderPanel();

  fireEvent.click(await screen.findByRole('button', { name: 'Usuń kategorię' }));
  expect(screen.getByText('Kategoria jest pusta — usunięcie nie zmieni żadnego wpisu.')).toBeVisible();
  fireEvent.click(screen.getByRole('button', { name: 'Anuluj' }));
  expect(deleteFacet).not.toHaveBeenCalled();

  fireEvent.click(screen.getByRole('button', { name: 'Usuń kategorię' }));
  fireEvent.click(screen.getByRole('button', { name: 'Potwierdź usunięcie' }));
  await waitFor(() => expect(deleteFacet).toHaveBeenCalledExactlyOnceWith('role'));
});

it('persists scoped aliases without losing existing aliases or metadata', async () => {
  const original = { alias: 'strażnik', entities: ['maneuvers'] };
  const definition = { tag: 'obrona', facetKey: 'role', label: 'Obrona', order: 3, aliases: [original] };
  getLayer.mockResolvedValue({
    facets: [{ key: 'role', label: 'Rola', order: 1, entities: ['maneuvers', 'spells'], selectionMode: 'multi', supportsNone: true }],
    definitions: [definition],
    tagEntities: {},
  });
  renderPanel();

  fireEvent.click(await screen.findByRole('button', { name: 'Tagi (1)' }));
  const input = screen.getByPlaceholderText('nowy alias');
  const add = screen.getByRole('button', { name: 'Dodaj alias' });
  expect(add).toBeDisabled();
  fireEvent.change(input, { target: { value: '  osłona  ' } });
  expect(add).toBeDisabled();
  fireEvent.click(screen.getByRole('checkbox', { name: 'Zaklęcia' }));
  fireEvent.click(add);

  await waitFor(() => expect(upsertDefinition).toHaveBeenLastCalledWith({
    ...definition, resource: 'definition', action: 'upsert',
    aliases: [original, { alias: 'osłona', entities: ['spells'] }],
  }));
  await waitFor(() => expect(input).toHaveValue(''));

  fireEvent.click(screen.getByRole('button', { name: /strażnik/ }));
  await waitFor(() => expect(upsertDefinition).toHaveBeenLastCalledWith({
    ...definition, resource: 'definition', action: 'upsert', aliases: [],
  }));

  const removeDefinition = screen.getByRole('button', { name: 'Usuń definicję' });
  await waitFor(() => expect(removeDefinition).toBeEnabled());
  fireEvent.click(removeDefinition);
  fireEvent.click(screen.getByRole('button', { name: 'Anuluj' }));
  expect(deleteDefinition).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', { name: 'Usuń definicję' }));
  fireEvent.click(screen.getByRole('button', { name: 'Usuń wraz z aliasami' }));
  await waitFor(() => expect(deleteDefinition).toHaveBeenCalledExactlyOnceWith('obrona'));
});
