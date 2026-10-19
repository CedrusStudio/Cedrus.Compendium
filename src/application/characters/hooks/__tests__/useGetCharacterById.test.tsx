import { renderToString } from 'react-dom/server';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useGetCharacterById } from '../useGetCharacterById';
import client from '@/infrastructure/clients/searchClient';

const access = vi.hoisted(() => ({ isLoaded: false, apiKey: null as string | null }));
vi.mock('next/navigation', () => ({ useParams: () => ({ id: 'character-1' }) }));
vi.mock('@/common/hooks/useApiKey', () => ({ useApiKey: () => access }));
vi.mock('@/infrastructure/clients/searchClient', () => ({ default: { searchById: vi.fn() } }));

function View() {
  const { character, isPending } = useGetCharacterById();
  return <p>{isPending ? 'loading' : character ? character.name : 'not found'}</p>;
}

describe('useGetCharacterById', () => {
  beforeEach(() => { vi.clearAllMocks(); access.isLoaded = false; access.apiKey = null; });

  it('renders a loading state without issuing a browser-relative request during SSR', () => {
    const queryClient = new QueryClient();
    expect(renderToString(<QueryClientProvider client={queryClient}><View /></QueryClientProvider>)).toContain('loading');
    expect(client.searchById).not.toHaveBeenCalled();
    queryClient.clear();
  });

  it('waits for the access key and then distinguishes an absent record from loading', async () => {
    vi.mocked(client.searchById).mockResolvedValue(null);
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const view = render(<QueryClientProvider client={queryClient}><View /></QueryClientProvider>);
    expect(screen.getByText('loading')).toBeInTheDocument();
    expect(client.searchById).not.toHaveBeenCalled();
    access.isLoaded = true;
    access.apiKey = 'fixture-key';
    view.rerender(<QueryClientProvider client={queryClient}><View /></QueryClientProvider>);
    await waitFor(() => expect(screen.getByText('not found')).toBeInTheDocument());
    expect(client.searchById).toHaveBeenCalledTimes(1);
    queryClient.clear();
  });
});
