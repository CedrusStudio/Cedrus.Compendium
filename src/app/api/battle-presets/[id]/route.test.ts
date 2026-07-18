import { beforeEach, describe, expect, it, vi } from 'vitest';

const { adminApiKeys, getBattlePresetById, updateBattlePreset, deleteBattlePreset } = vi.hoisted(() => ({
  adminApiKeys: ['alpha'] as string[],
  getBattlePresetById: vi.fn(),
  updateBattlePreset: vi.fn(),
  deleteBattlePreset: vi.fn(),
}));

vi.mock('@/lib/env', () => ({
  adminApiKeys,
}));

vi.mock('@/persistence/battlePresets/battlePresetsRepository', () => ({
  getBattlePresetById: (...args: unknown[]) => getBattlePresetById(...args),
  updateBattlePreset: (...args: unknown[]) => updateBattlePreset(...args),
  deleteBattlePreset: (...args: unknown[]) => deleteBattlePreset(...args),
}));

import { DELETE, GET, PUT } from '@/app/api/battle-presets/[id]/route';
import { hashApiKey } from '@/lib/apiKeyHash';
import { BattlePresetNotFoundError } from '@/persistence/battlePresets/battlePresetErrors';
import { API_KEY_HEADER } from '@/proxy';

function params(id: string)
{
  return { params: Promise.resolve({ id }) };
}

describe('battle-presets [id] route', () => {
  beforeEach(() => {
    adminApiKeys.splice(0, adminApiKeys.length, 'alpha');
    getBattlePresetById.mockReset();
    updateBattlePreset.mockReset();
    deleteBattlePreset.mockReset();
  });

  describe('GET', () => {
    it('rejects a request with no x-api-key header', async () => {
      const response = await GET(new Request('http://localhost/api/battle-presets/preset-1'), params('preset-1'));

      expect(response.status).toBe(401);
    });

    it('returns 404 when the repository reports the preset as not owned/found (Test 5: brak dostępu)', async () => {
      getBattlePresetById.mockResolvedValue(null);

      const response = await GET(new Request('http://localhost/api/battle-presets/preset-1', {
        headers: { [API_KEY_HEADER]: 'alpha' },
      }), params('preset-1'));

      expect(getBattlePresetById).toHaveBeenCalledWith('preset-1', hashApiKey('alpha'));
      expect(response.status).toBe(404);
    });

    it('returns the preset when owned by the requesting API key (Test 2: bitwa odtworzona)', async () => {
      const preset = { id: 'preset-1', name: 'Raid Test Setup', configuration: { characterIds: [] }, createdAt: new Date(), updatedAt: new Date() };
      getBattlePresetById.mockResolvedValue(preset);

      const response = await GET(new Request('http://localhost/api/battle-presets/preset-1', {
        headers: { [API_KEY_HEADER]: 'alpha' },
      }), params('preset-1'));

      expect(response.status).toBe(200);
    });
  });

  describe('PUT', () => {
    it('rejects an empty name', async () => {
      const response = await PUT(new Request('http://localhost/api/battle-presets/preset-1', {
        method: 'PUT',
        headers: { [API_KEY_HEADER]: 'alpha' },
        body: JSON.stringify({ name: '   ' }),
      }), params('preset-1'));

      expect(response.status).toBe(400);
      expect(updateBattlePreset).not.toHaveBeenCalled();
    });

    it('returns 404 instead of forwarding an update for a preset owned by a different API key', async () => {
      updateBattlePreset.mockRejectedValue(new BattlePresetNotFoundError('preset-1'));

      const response = await PUT(new Request('http://localhost/api/battle-presets/preset-1', {
        method: 'PUT',
        headers: { [API_KEY_HEADER]: 'alpha' },
        body: JSON.stringify({ name: 'Hijacked' }),
      }), params('preset-1'));

      expect(response.status).toBe(404);
    });

    it('updates the preset when owned by the requesting API key (Test 3: zmiany zapisane)', async () => {
      const updated = { id: 'preset-1', name: 'Renamed', configuration: { characterIds: [] }, createdAt: new Date(), updatedAt: new Date() };
      updateBattlePreset.mockResolvedValue(updated);

      const response = await PUT(new Request('http://localhost/api/battle-presets/preset-1', {
        method: 'PUT',
        headers: { [API_KEY_HEADER]: 'alpha' },
        body: JSON.stringify({ name: 'Renamed' }),
      }), params('preset-1'));

      expect(updateBattlePreset).toHaveBeenCalledWith('preset-1', hashApiKey('alpha'), { name: 'Renamed' });
      expect(response.status).toBe(200);
    });
  });

  describe('DELETE', () => {
    it('returns 404 instead of deleting a preset owned by a different API key', async () => {
      deleteBattlePreset.mockRejectedValue(new BattlePresetNotFoundError('preset-1'));

      const response = await DELETE(new Request('http://localhost/api/battle-presets/preset-1', {
        method: 'DELETE',
        headers: { [API_KEY_HEADER]: 'alpha' },
      }), params('preset-1'));

      expect(response.status).toBe(404);
    });

    it('deletes the preset when owned by the requesting API key (Test 4: preset usunięty)', async () => {
      deleteBattlePreset.mockResolvedValue(undefined);

      const response = await DELETE(new Request('http://localhost/api/battle-presets/preset-1', {
        method: 'DELETE',
        headers: { [API_KEY_HEADER]: 'alpha' },
      }), params('preset-1'));

      expect(deleteBattlePreset).toHaveBeenCalledWith('preset-1', hashApiKey('alpha'));
      expect(response.status).toBe(204);
    });
  });
});
