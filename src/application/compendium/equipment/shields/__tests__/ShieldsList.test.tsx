import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

// Mock all external dependencies
vi.mock('@/infrastructure/clients/equipment/shieldsClient', () => ({
  default: { add: vi.fn(), update: vi.fn(), delete: vi.fn() }
}));

vi.mock('@/infrastructure/clients/searchClient', () => ({
  default: { search: vi.fn().mockResolvedValue([]) }
}));

vi.mock('@/common/hooks/useEntityTags', () => ({
  useEntityTags: () => ({ tags: ['tag1', 'tag2'], isLoading: false, error: null })
}));

vi.mock('@/infrastructure/hooks/useFormMutation', () => ({
  useFormMutation: () => ({ handleSubmit: vi.fn(), isPending: false })
}));

vi.mock('@/common/components/WithScroll', () => ({
  WithScroll: ({ items, renderItem }: { items: unknown[]; renderItem: (item: unknown, index: number) => React.ReactNode }) => (
    <div>{items.map((item, i) => renderItem(item, i))}</div>
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
  FormField: () => null,
  FormItem: () => null,
  FormControl: () => null,
  FormMessage: () => null,
}));

vi.mock('@/common/components/lists/ListHeader', () => ({
  default: ({ children }: { children: React.ReactNode }) => <div data-testid="list-header">{children}</div>
}));

vi.mock('@/application/common/equipment/ItemAddSheet', () => ({
  default: () => <div data-testid="add-sheet" />
}));

vi.mock('@/application/common/equipment/EditSheets/ShieldEditableFields', () => ({
  default: () => <div />
}));

vi.mock('@/application/compendium/equipment/shields/ShieldView', () => ({
  default: ({ shield }: { shield: { id: string; name: string } }) => (
    <div data-testid={`shield-${shield.id}`}>{shield.name}</div>
  )
}));

import ShieldsList from '../ShieldsList';

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
}

function renderShieldsList(queryClient?: QueryClient) {
  const client = queryClient ?? createTestQueryClient();
  return render(
    <QueryClientProvider client={client}>
      <ShieldsList />
    </QueryClientProvider>
  );
}

describe('ShieldsList - tag filter infinite loop fix', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render without errors when query data is undefined (loading state)', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    await act(async () => {
      renderShieldsList();
    });

    // The key assertion: no "Maximum update depth exceeded" error
    const errorMessages = consoleSpy.mock.calls.map(call => String(call[0]));
    const hasInfiniteLoopError = errorMessages.some(msg =>
      msg.includes('Maximum update depth exceeded') ||
      msg.includes('Too many re-renders')
    );
    expect(hasInfiniteLoopError).toBe(false);
    consoleSpy.mockRestore();
  });

  it('should render the list header', async () => {
    const { getByTestId } = await act(async () => renderShieldsList());
    expect(getByTestId('list-header')).toBeTruthy();
  });

  it('should render shields when query resolves with data', async () => {
    const mockShields = [
      { id: '01ARZ3NDEKTSV4RRFFQ69G5FAV', name: 'Iron Shield', description: 'A sturdy shield', tags: [], resistance: 5, dexterityRestriction: 0, reflexRestriction: 0, initiativeRestriction: 0, attributePenalty: 0, strengthRequirement: 0, block: 3 }
    ];

    const { default: searchClient } = await import('@/infrastructure/clients/searchClient');
    vi.mocked(searchClient.search).mockResolvedValue(mockShields);

    const client = createTestQueryClient();
    const { findByTestId } = render(
      <QueryClientProvider client={client}>
        <ShieldsList />
      </QueryClientProvider>
    );

    const shieldEl = await findByTestId('shield-01ARZ3NDEKTSV4RRFFQ69G5FAV');
    expect(shieldEl).toBeTruthy();
    expect(shieldEl.textContent).toBe('Iron Shield');
  });
});
