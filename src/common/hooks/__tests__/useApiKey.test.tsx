import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { API_KEY_CHANGED_EVENT, API_KEY_STORAGE_KEY, useApiKey } from '@/common/hooks/useApiKey';

describe('useApiKey', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('synchronizes the stored API key when the change event is dispatched', async () => {
    localStorage.setItem(API_KEY_STORAGE_KEY, 'alpha');

    const { result } = renderHook(() => useApiKey());

    await waitFor(() => expect(result.current.isLoaded).toBe(true));
    expect(result.current.apiKey).toBe('alpha');

    act(() => {
      localStorage.setItem(API_KEY_STORAGE_KEY, 'beta');
      window.dispatchEvent(new Event(API_KEY_CHANGED_EVENT));
    });

    expect(result.current.apiKey).toBe('beta');
  });
});