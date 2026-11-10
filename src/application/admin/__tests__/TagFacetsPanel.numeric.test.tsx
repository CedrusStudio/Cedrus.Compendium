import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { beforeEach, expect, it, vi } from 'vitest';
import { TagFacetError } from '@/infrastructure/clients/tagFacetsClient';

const { getLayer, getDrift, upsertFacet, deleteFacet, upsertDefinition, deleteDefinition } = vi.hoisted(() => ({
  getLayer: vi.fn(),
  getDrift: vi.fn(),
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
    getDrift,
    upsertFacet,
    deleteFacet,
  },
}));
import TagFacetsPanel from '../TagFacetsPanel';

beforeEach(() => {
  getDrift.mockReset().mockResolvedValue({ undefinedTags: [], unusedDefinitions: [], deadFacetEntities: [], partialCoverage: [], ineffectiveAssignments: [], tagEntities: {} });
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

it('offers only useful categories for unassigned tags and exposes all kinds of drift', async () => {
  const user = userEvent.setup();
  getLayer.mockResolvedValue({
    facets: [
      { key: 'schools', label: 'Szkoła', order: 2, entities: ['spells'], selectionMode: 'multi', supportsNone: false },
      { key: 'role', label: 'Rola', order: 1, entities: ['maneuvers'], selectionMode: 'single', supportsNone: true },
    ],
    definitions: [],
    tagEntities: {},
  });
  getDrift.mockResolvedValue({
    ineffectiveAssignments: [{ tag: 'straż', facetKey: 'schools', tagEntities: ['maneuvers'], facetEntities: ['spells'] }],
    undefinedTags: [{ tag: 'natarcie', entities: ['maneuvers'], occurrences: 3 }],
    partialCoverage: [{ facetKey: 'role', entity: 'spells', tags: ['osłona', 'ochrona'] }],
    unusedDefinitions: [{ tag: 'dawna-osłona', facetKey: 'role' }],
    deadFacetEntities: [{ facetKey: 'schools', entity: 'spells' }],
    tagEntities: {},
  });
  renderPanel();

  expect(await screen.findByText('straż')).toBeVisible();
  expect(screen.getByText(/2 tagi tej kategorii: osłona, ochrona/)).toBeVisible();
  expect(screen.getByText('dawna-osłona')).toBeVisible();
  expect(screen.getByText('schools → Zaklęcia')).toBeVisible();

  const unassigned = within(screen.getByText('natarcie').closest('li')!);
  await user.click(unassigned.getByRole('combobox'));
  expect(await screen.findByRole('option', { name: 'Rola (Manewry)' })).toBeVisible();
  expect(screen.queryByRole('option', { name: 'Szkoła (Zaklęcia)' })).not.toBeInTheDocument();
  await user.click(screen.getByRole('option', { name: 'Rola (Manewry)' }));
  await waitFor(() => expect(upsertDefinition).toHaveBeenLastCalledWith({
    resource: 'definition', action: 'upsert', tag: 'natarcie', facetKey: 'role', aliases: [],
  }));

  const ineffective = within(screen.getByText('straż').closest('li')!);
  const previous = ineffective.getByRole('combobox');
  await waitFor(() => expect(previous).toBeEnabled());
  await user.click(previous);
  expect(await screen.findByRole('option', { name: 'Szkoła (Zaklęcia)' })).toBeVisible();
  await user.click(screen.getByRole('option', { name: 'Rola (Manewry)' }));
  await waitFor(() => expect(upsertDefinition).toHaveBeenLastCalledWith({
    resource: 'definition', action: 'upsert', tag: 'straż', facetKey: 'role', aliases: [],
  }));
});

it('warns about removing a list from a facet and saves the edited metadata under the same key', async () => {
  const user = userEvent.setup();
  getLayer.mockResolvedValue({
    facets: [{ key: 'role', label: 'Rola', order: 1, entities: ['maneuvers', 'spells'], selectionMode: 'multi', supportsNone: true }],
    definitions: [{ tag: 'obrona', facetKey: 'role' }],
    tagEntities: {},
  });
  renderPanel();

  fireEvent.click(await screen.findByRole('button', { name: 'Edytuj' }));
  fireEvent.change(screen.getByPlaceholderText('nazwa'), { target: { value: '  Rola bojowa  ' } });
  fireEvent.change(screen.getByPlaceholderText('opis — widoczny w filtrze pod nazwą kategorii'), { target: { value: '  Styl walki  ' } });
  await user.click(screen.getByRole('combobox'));
  await user.click(await screen.findByRole('option', { name: 'jedna wartość' }));
  fireEvent.click(screen.getByRole('checkbox', { name: /pokaż/ }));
  fireEvent.click(screen.getByRole('checkbox', { name: 'Zaklęcia' }));
  expect(screen.getByText(/Zabierasz: Zaklęcia. 1 tag/)).toBeVisible();

  fireEvent.change(screen.getByPlaceholderText('kolejność'), { target: { value: '1.5' } });
  fireEvent.click(screen.getByRole('button', { name: 'Zapisz' }));
  expect(screen.getByRole('alert')).toHaveTextContent('Wpisz liczbę całkowitą');
  expect(upsertFacet).not.toHaveBeenCalled();

  fireEvent.change(screen.getByPlaceholderText('kolejność'), { target: { value: '2' } });
  fireEvent.click(screen.getByRole('button', { name: 'Zapisz' }));
  await waitFor(() => expect(upsertFacet).toHaveBeenCalledExactlyOnceWith({
    resource: 'facet', action: 'upsert', key: 'role', label: 'Rola bojowa',
    description: 'Styl walki', order: 2, selectionMode: 'single', supportsNone: false, entities: ['maneuvers'],
  }));
});

it('assigns an uncategorized tag and clears a category while retaining definition metadata', async () => {
  const user = userEvent.setup();
  const alias = { alias: 'straż', entities: ['maneuvers'] };
  getLayer.mockResolvedValue({
    facets: [{ key: 'role', label: 'Rola', description: 'Rola w walce', order: 1, entities: ['maneuvers'], selectionMode: 'multi', supportsNone: true }],
    definitions: [
      { tag: 'natarcie', facetKey: null, aliases: [] },
      { tag: 'osłona', facetKey: 'role', label: 'Osłona', order: 4, aliases: [alias], formerNames: ['ochrona'] },
    ],
  });
  renderPanel();

  const unassigned = within((await screen.findByText('natarcie')).parentElement!);
  await user.click(unassigned.getByRole('combobox'));
  await user.click(await screen.findByRole('option', { name: 'Rola (Manewry)' }));
  await waitFor(() => expect(upsertDefinition).toHaveBeenLastCalledWith({
    resource: 'definition', action: 'upsert', tag: 'natarcie', facetKey: 'role', label: null, order: null, aliases: [],
  }));

  expect(screen.getByText('Rola w walce')).toBeVisible();
  fireEvent.click(screen.getByRole('button', { name: 'Tagi (1)' }));
  expect(screen.getByText('dawniej: ochrona')).toBeVisible();
  const assigned = within(screen.getByText('osłona').parentElement!);
  const category = assigned.getByRole('combobox');
  await waitFor(() => expect(category).toBeEnabled());
  await user.click(category);
  await user.click(await screen.findByRole('option', { name: '— brak kategorii —' }));
  await waitFor(() => expect(upsertDefinition).toHaveBeenLastCalledWith({
    resource: 'definition', action: 'upsert', tag: 'osłona', facetKey: null, label: 'Osłona', order: 4, aliases: [alias],
  }));
});

it('keeps a populated category intact after a failed delete', async () => {
  deleteFacet.mockRejectedValueOnce(new Error('mock offline'));
  getLayer.mockResolvedValue({
    facets: [{ key: 'role', label: 'Rola', order: 1, entities: ['maneuvers'], selectionMode: 'multi', supportsNone: true }],
    definitions: [{ tag: 'osłona', facetKey: 'role' }],
  });
  renderPanel();
  fireEvent.click(await screen.findByRole('button', { name: 'Usuń kategorię' }));
  expect(screen.getByText(/1 tag\(ów\) wróci/)).toBeVisible();
  fireEvent.click(screen.getByRole('button', { name: 'Potwierdź usunięcie' }));
  expect(await screen.findByText('Nie udało się zapisać.')).toBeVisible();
  expect(screen.getByRole('button', { name: 'Tagi (1)' })).toBeVisible();
});
