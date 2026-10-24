import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { expect, it, vi } from 'vitest';

const { upsertFacet } = vi.hoisted(() => ({ upsertFacet: vi.fn().mockResolvedValue(undefined) }));
vi.mock('@/infrastructure/clients/tagFacetsClient', () => ({
  TagFacetError: class extends Error {},
  default: {
    getLayer: async () => ({ facets: [{ key: 'role', label: 'Rola', order: 1, entities: ['maneuvers'], selectionMode: 'multi', supportsNone: true }], definitions: [], tagEntities: {} }),
    getDrift: async () => ({ undefinedTags: [], unusedDefinitions: [], deadFacetEntities: [], partialCoverage: [], ineffectiveAssignments: [], tagEntities: {} }),
    upsertFacet,
  },
}));
import TagFacetsPanel from '../TagFacetsPanel';

it('requires an explicit category order instead of restoring the previous number', async () => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(<QueryClientProvider client={queryClient}><TagFacetsPanel /></QueryClientProvider>);
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
