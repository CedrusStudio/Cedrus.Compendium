import { ReactNode } from 'react';
import { act, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { API_KEY_CHANGED_EVENT, API_KEY_STORAGE_KEY, getStoredApiKey, useApiKey } from '@/common/hooks/useApiKey';
import { createTestQueryClient } from '@/__tests__/utils/testUtils';

function createWrapper(queryClient: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

describe('useApiKey', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('synchronizes the stored API key when the change event is dispatched', async () => {
    localStorage.setItem(API_KEY_STORAGE_KEY, 'alpha');

    const { result } = renderHook(() => useApiKey(), { wrapper: createWrapper(createTestQueryClient()) });

    await waitFor(() => expect(result.current.isLoaded).toBe(true));
    expect(result.current.apiKey).toBe('alpha');

    act(() => {
      localStorage.setItem(API_KEY_STORAGE_KEY, 'beta');
      window.dispatchEvent(new Event(API_KEY_CHANGED_EVENT));
    });

    expect(result.current.apiKey).toBe('beta');
  });

  it('saves trimmed API keys, ignores blank values, and removes the stored key', async () => {
    const { result } = renderHook(() => useApiKey(), { wrapper: createWrapper(createTestQueryClient()) });

    await waitFor(() => expect(result.current.isLoaded).toBe(true));
    expect(result.current.hasApiKey).toBe(false);

    act(() => {
      result.current.saveApiKey('   ');
    });

    expect(localStorage.getItem(API_KEY_STORAGE_KEY)).toBeNull();
    expect(result.current.apiKey).toBeNull();

    act(() => {
      result.current.saveApiKey('  alpha  ');
    });

    expect(localStorage.getItem(API_KEY_STORAGE_KEY)).toBe('alpha');
    expect(result.current.apiKey).toBe('alpha');
    expect(result.current.hasApiKey).toBe(true);
    expect(getStoredApiKey()).toBe('alpha');

    act(() => {
      result.current.removeApiKey();
    });

    expect(localStorage.getItem(API_KEY_STORAGE_KEY)).toBeNull();
    expect(result.current.apiKey).toBeNull();
    expect(result.current.hasApiKey).toBe(false);
    expect(getStoredApiKey()).toBeNull();
  });

  it('invalidates the characters query cache when the API key is saved or removed', async () => {
    const queryClient = createTestQueryClient();
    const invalidateQueriesSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useApiKey(), { wrapper: createWrapper(queryClient) });

    await waitFor(() => expect(result.current.isLoaded).toBe(true));

    act(() => {
      result.current.saveApiKey('alpha');
    });

    expect(invalidateQueriesSpy).toHaveBeenCalledWith({ queryKey: ['characters'] });

    invalidateQueriesSpy.mockClear();

    act(() => {
      result.current.removeApiKey();
    });

    expect(invalidateQueriesSpy).toHaveBeenCalledWith({ queryKey: ['characters'] });
  });

  it('invalidates the battle-presets query cache when the API key is saved or removed (Test 6: lista presetów odświeżona)', async () => {
    const queryClient = createTestQueryClient();
    const invalidateQueriesSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useApiKey(), { wrapper: createWrapper(queryClient) });

    await waitFor(() => expect(result.current.isLoaded).toBe(true));

    act(() => {
      result.current.saveApiKey('alpha');
    });

    expect(invalidateQueriesSpy).toHaveBeenCalledWith({ queryKey: ['battle-presets'] });

    invalidateQueriesSpy.mockClear();

    act(() => {
      result.current.removeApiKey();
    });

    expect(invalidateQueriesSpy).toHaveBeenCalledWith({ queryKey: ['battle-presets'] });
  });

  it('does not invalidate the characters query cache for blank keys', async () => {
    const queryClient = createTestQueryClient();
    const invalidateQueriesSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useApiKey(), { wrapper: createWrapper(queryClient) });

    await waitFor(() => expect(result.current.isLoaded).toBe(true));

    act(() => {
      result.current.saveApiKey('   ');
    });

    expect(invalidateQueriesSpy).not.toHaveBeenCalled();
  });

  it('returns null when getStoredApiKey is called without a window object', () => {
    const originalWindow = globalThis.window;

    Object.defineProperty(globalThis, 'window', {
      value: undefined,
      configurable: true,
    });

    try {
      expect(getStoredApiKey()).toBeNull();
    } finally {
      Object.defineProperty(globalThis, 'window', {
        value: originalWindow,
        configurable: true,
      });
    }
  });
});