import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { userEvent } from '@/__tests__/utils/testUtils';

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

vi.mock('@/common/components/WithScroll', () => ({
  WithScroll: ({ items, renderItem }: { items: unknown[]; renderItem: (item: unknown) => React.ReactNode }) => (
    <div>{items.map((item, index) => renderItem(item, index))}</div>
  )
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

vi.mock('@/common/components/lists/ListHeader', () => ({
  default: ({ children }: { children: React.ReactNode }) => <div data-testid="list-header">{children}</div>
}));

vi.mock('@/application/common/PerkableAddSheet', () => ({
  default: () => <div data-testid="add-maneuver-sheet" />
}));

vi.mock('@/common/components/lists/GroupedItemsList', () => ({
  default: () => <div data-testid="grouped-maneuvers-list" />
}));

vi.mock('@/application/compendium/maneuvers/ManeuverView', () => ({
  default: ({ maneuver }: { maneuver: { id: string; name: string } }) => <div data-testid={`maneuver-${maneuver.id}`}>{maneuver.name}</div>
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
    vi.clearAllMocks();
    localStorage.clear();
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