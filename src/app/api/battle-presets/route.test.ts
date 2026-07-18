import { beforeEach, describe, expect, it, vi } from 'vitest';

const { adminApiKeys, getBattlePresetSummariesForApiKey, addBattlePreset } = vi.hoisted(() => ({
  adminApiKeys: ['alpha'] as string[],
  getBattlePresetSummariesForApiKey: vi.fn(),
  addBattlePreset: vi.fn(),
}));

vi.mock('@/lib/env', () => ({
  adminApiKeys,
}));

vi.mock('@/persistence/battlePresets/battlePresetsRepository', () => ({
  getBattlePresetSummariesForApiKey: (...args: unknown[]) => getBattlePresetSummariesForApiKey(...args),
  addBattlePreset: (...args: unknown[]) => addBattlePreset(...args),
}));

import { GET, POST } from '@/app/api/battle-presets/route';
import { hashApiKey } from '@/lib/apiKeyHash';
import { BattlePresetValidationError } from '@/persistence/battlePresets/battlePresetErrors';
import { API_KEY_HEADER } from '@/proxy';

describe('battle-presets list route', () => {
  beforeEach(() => {
    adminApiKeys.splice(0, adminApiKeys.length, 'alpha');
    getBattlePresetSummariesForApiKey.mockReset();
    addBattlePreset.mockReset();
  });

  describe('GET', () => {
    it('rejects a request with no x-api-key header', async () => {
      const response = await GET(new Request('http://localhost/api/battle-presets'));

      expect(response.status).toBe(401);
      expect(getBattlePresetSummariesForApiKey).not.toHaveBeenCalled();
    });

    it('rejects a key outside the configured admin pool', async () => {
      const response = await GET(new Request('http://localhost/api/battle-presets', {
        headers: { [API_KEY_HEADER]: 'gamma' },
      }));

      expect(response.status).toBe(403);
      expect(getBattlePresetSummariesForApiKey).not.toHaveBeenCalled();
    });

    it('scopes the returned list to the hash of the requesting API key (Test 5 / 6)', async () => {
      const presets = [{ id: 'preset-1', name: 'Raid Test Setup', createdAt: new Date(), updatedAt: new Date() }];
      getBattlePresetSummariesForApiKey.mockResolvedValue(presets);

      const response = await GET(new Request('http://localhost/api/battle-presets', {
        headers: { [API_KEY_HEADER]: 'alpha' },
      }));

      expect(getBattlePresetSummariesForApiKey).toHaveBeenCalledWith(hashApiKey('alpha'));
      expect(response.status).toBe(200);
    });
  });

  describe('POST', () => {
    it('rejects a missing name', async () => {
      const response = await POST(new Request('http://localhost/api/battle-presets', {
        method: 'POST',
        headers: { [API_KEY_HEADER]: 'alpha' },
        body: JSON.stringify({ configuration: {} }),
      }));

      expect(response.status).toBe(400);
      expect(addBattlePreset).not.toHaveBeenCalled();
    });

    it('rejects a missing configuration', async () => {
      const response = await POST(new Request('http://localhost/api/battle-presets', {
        method: 'POST',
        headers: { [API_KEY_HEADER]: 'alpha' },
        body: JSON.stringify({ name: 'Boss Fight Setup' }),
      }));

      expect(response.status).toBe(400);
      expect(addBattlePreset).not.toHaveBeenCalled();
    });

    it('creates a preset scoped to the hash of the requesting API key (Test 1: Preset zapisany)', async () => {
      addBattlePreset.mockResolvedValue('preset-new');

      const response = await POST(new Request('http://localhost/api/battle-presets', {
        method: 'POST',
        headers: { [API_KEY_HEADER]: 'alpha' },
        body: JSON.stringify({ name: 'Boss Fight Setup', configuration: { characterIds: [] } }),
      }));

      expect(addBattlePreset).toHaveBeenCalledWith(hashApiKey('alpha'), 'Boss Fight Setup', { characterIds: [] });
      expect(response.status).toBe(201);
      await expect(response.json()).resolves.toEqual({ id: 'preset-new' });
    });

    it('surfaces BattlePresetValidationError (e.g. the 100-preset limit) as a 400', async () => {
      addBattlePreset.mockRejectedValue(new BattlePresetValidationError('Battle preset limit reached (100 per API key).'));

      const response = await POST(new Request('http://localhost/api/battle-presets', {
        method: 'POST',
        headers: { [API_KEY_HEADER]: 'alpha' },
        body: JSON.stringify({ name: 'One Too Many', configuration: { characterIds: [] } }),
      }));

      expect(response.status).toBe(400);
    });
  });
});
