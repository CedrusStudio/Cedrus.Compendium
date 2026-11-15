import type { PropsWithChildren } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { CreateEmptyCharacter } from '@/domain/characters/Character';

const mocks = vi.hoisted(() => ({ getByIds: vi.fn(), key: 'key-a' }));
vi.mock('@/infrastructure/clients/charactersClient', () => ({ default: { getByIds: mocks.getByIds } }));
vi.mock('@/common/hooks/useApiKey', () => ({ useApiKey: () => ({ apiKey: mocks.key }) }));
import { useCharactersByIds } from './useCharactersByIds';

describe('domain character batch consumption', () => {
  it('retains domain data without applying a second persistence mapping and isolates keys', async () => {
    const character = { ...CreateEmptyCharacter({ name: 'Test', shortName: 'Test', description: 'Test', tags: [] }), id: 'character' };
    mocks.key = 'key-a';
    mocks.getByIds.mockReset().mockResolvedValueOnce([character]).mockResolvedValueOnce([]);
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const wrapper = ({ children }: PropsWithChildren) => <QueryClientProvider client={client}>{children}</QueryClientProvider>;
    const { result, rerender, unmount } = renderHook(() => useCharactersByIds(['character']), { wrapper });
    await waitFor(() => expect(result.current.byId.get('character')).toEqual(character));
    mocks.key = 'key-b';
    rerender();
    expect(result.current.byId.has('character')).toBe(false);
    await waitFor(() => expect(mocks.getByIds).toHaveBeenCalledTimes(2));
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.byId.size).toBe(0);
    unmount();
    client.clear();
  });
});
