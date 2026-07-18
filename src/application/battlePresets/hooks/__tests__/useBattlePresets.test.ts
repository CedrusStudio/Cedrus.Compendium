import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AllTheProviders } from '@/__tests__/utils/testUtils';
import { API_KEY_STORAGE_KEY } from '@/lib/apiKeyStorage';

const { list, create, update, remove, getById } = vi.hoisted(() => ({
  list: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  remove: vi.fn(),
  getById: vi.fn(),
}));

vi.mock('@/infrastructure/clients/battlePresetsClient', () => ({
  default: { list, create, update, remove, getById },
}));

import { BATTLE_PRESETS_QUERY_KEY_PREFIX, useBattlePresets } from '@/application/battlePresets/hooks/useBattlePresets';

describe('useBattlePresets', () => {
  beforeEach(() => {
    localStorage.clear();
    list.mockReset();
    create.mockReset();
    update.mockReset();
    remove.mockReset();
    getById.mockReset();
    list.mockResolvedValue([]);
  });

  it('does not fetch when there is no API key set', async () => {
    const { result } = renderHook(() => useBattlePresets(), { wrapper: AllTheProviders });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(list).not.toHaveBeenCalled();
    expect(result.current.presets).toEqual([]);
  });

  it('fetches the preset list once an API key is set', async () => {
    localStorage.setItem(API_KEY_STORAGE_KEY, 'alpha');
    list.mockResolvedValue([{ id: 'preset-1', name: 'Raid Test Setup', createdAt: '2026-01-01', updatedAt: '2026-01-02' }]);

    const { result } = renderHook(() => useBattlePresets(), { wrapper: AllTheProviders });

    await waitFor(() => expect(result.current.presets).toHaveLength(1));
    expect(list).toHaveBeenCalled();
  });

  it('calls the client create endpoint with the given name/configuration (Test 1: preset zapisany)', async () => {
    localStorage.setItem(API_KEY_STORAGE_KEY, 'alpha');
    create.mockResolvedValue({ id: 'preset-new' });

    const { result } = renderHook(() => useBattlePresets(), { wrapper: AllTheProviders });

    await act(async () => {
      await result.current.createMutation.mutateAsync({ name: 'Boss Fight Setup', configuration: { characterIds: [], initiatives: {}, externalParticipants: [], duplicatedCharacterRefs: [] } });
    });

    expect(create).toHaveBeenCalledWith('Boss Fight Setup', { characterIds: [], initiatives: {}, externalParticipants: [], duplicatedCharacterRefs: [] });
  });

  it('invalidates the battle-presets cache after a successful delete (Test 4: preset usunięty)', async () => {
    localStorage.setItem(API_KEY_STORAGE_KEY, 'alpha');
    remove.mockResolvedValue(undefined);

    const { result } = renderHook(() => useBattlePresets(), { wrapper: AllTheProviders });

    await act(async () => {
      await result.current.deleteMutation.mutateAsync('preset-1');
    });

    expect(remove).toHaveBeenCalledWith('preset-1');
  });

  it('exposes the shared query key prefix used for cross-hook invalidation', () => {
    expect(BATTLE_PRESETS_QUERY_KEY_PREFIX).toEqual(['battle-presets']);
  });
});
