import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createEmptyBattleConfiguration } from '@/domain/battlePresets/BattleConfiguration';

const { findMany, findUnique, count, create, update, remove } = vi.hoisted(() => ({
  findMany: vi.fn(),
  findUnique: vi.fn(),
  count: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  remove: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({
  default: {
    battlePreset: { findMany, findUnique, count, create, update, delete: remove },
  },
}));

import {
  addBattlePreset,
  deleteBattlePreset,
  getBattlePresetById,
  getBattlePresetSummariesForApiKey,
  updateBattlePreset,
} from '@/persistence/battlePresets/battlePresetsRepository';
import { BattlePresetNotFoundError, BattlePresetValidationError } from '@/persistence/battlePresets/battlePresetErrors';

const OWNER_HASH = 'hash-of-owner-key';
const OTHER_HASH = 'hash-of-other-key';

function record(overrides: Partial<{
  id: string;
  name: string;
  apiKeyHash: string;
  configuration: unknown;
  createdAt: Date;
  updatedAt: Date;
}> = {})
{
  return {
    id: 'preset-1',
    name: 'Raid Test Setup',
    apiKeyHash: OWNER_HASH,
    configuration: createEmptyBattleConfiguration(),
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-02T00:00:00.000Z'),
    ...overrides,
  };
}

describe('battlePresetsRepository', () => {
  beforeEach(() => {
    findMany.mockReset();
    findUnique.mockReset();
    count.mockReset();
    create.mockReset();
    update.mockReset();
    remove.mockReset();
  });

  describe('getBattlePresetSummariesForApiKey', () => {
    it('filters exclusively by apiKeyHash at the database query level (Test 5 z dokumentu)', async () => {
      findMany.mockResolvedValue([record()]);

      await getBattlePresetSummariesForApiKey(OWNER_HASH);

      expect(findMany).toHaveBeenCalledWith({
        where: { apiKeyHash: OWNER_HASH },
        select: { id: true, name: true, createdAt: true, updatedAt: true },
        orderBy: { updatedAt: 'desc' },
      });
    });
  });

  describe('getBattlePresetById', () => {
    it('returns the preset when it belongs to the requesting API key', async () => {
      findUnique.mockResolvedValue(record());

      const result = await getBattlePresetById('preset-1', OWNER_HASH);

      expect(result).toEqual(expect.objectContaining({ id: 'preset-1', name: 'Raid Test Setup' }));
    });

    it('returns null when the id does not exist', async () => {
      findUnique.mockResolvedValue(null);

      const result = await getBattlePresetById('missing', OWNER_HASH);

      expect(result).toBeNull();
    });

    it('returns null when the preset belongs to a different API key (Test 5: API Key A nie widzi presetów API Key B)', async () => {
      findUnique.mockResolvedValue(record({ apiKeyHash: OTHER_HASH }));

      const result = await getBattlePresetById('preset-1', OWNER_HASH);

      expect(result).toBeNull();
    });
  });

  describe('addBattlePreset', () => {
    it('creates a preset under the limit', async () => {
      count.mockResolvedValue(3);
      create.mockResolvedValue(record({ id: 'preset-new' }));

      const id = await addBattlePreset(OWNER_HASH, 'Boss Fight Setup', createEmptyBattleConfiguration());

      expect(id).toBe('preset-new');
      expect(create).toHaveBeenCalledWith({
        data: { name: 'Boss Fight Setup', apiKeyHash: OWNER_HASH, configuration: createEmptyBattleConfiguration() },
      });
    });

    it('throws BattlePresetValidationError at the configured limit (Weryfikacja 3: 100 presetów na API Key)', async () => {
      count.mockResolvedValue(100);

      await expect(
        addBattlePreset(OWNER_HASH, 'One Too Many', createEmptyBattleConfiguration()),
      ).rejects.toThrow(BattlePresetValidationError);

      expect(create).not.toHaveBeenCalled();
    });
  });

  describe('updateBattlePreset', () => {
    it('updates when the preset belongs to the requesting API key (Test 3: Zmiany zapisane)', async () => {
      findUnique.mockResolvedValue(record());
      update.mockResolvedValue(record({ name: 'Renamed' }));

      const result = await updateBattlePreset('preset-1', OWNER_HASH, { name: 'Renamed' });

      expect(result.name).toBe('Renamed');
      expect(update).toHaveBeenCalledWith({ where: { id: 'preset-1' }, data: { name: 'Renamed' } });
    });

    it('throws BattlePresetNotFoundError instead of silently overwriting a preset owned by a different API key', async () => {
      findUnique.mockResolvedValue(record({ apiKeyHash: OTHER_HASH }));

      await expect(
        updateBattlePreset('preset-1', OWNER_HASH, { name: 'Hijacked' }),
      ).rejects.toThrow(BattlePresetNotFoundError);

      expect(update).not.toHaveBeenCalled();
    });

    it('throws BattlePresetNotFoundError when the id does not exist', async () => {
      findUnique.mockResolvedValue(null);

      await expect(
        updateBattlePreset('missing', OWNER_HASH, { name: 'Anything' }),
      ).rejects.toThrow(BattlePresetNotFoundError);
    });
  });

  describe('deleteBattlePreset', () => {
    it('deletes when the preset belongs to the requesting API key (Test 4: Preset usunięty)', async () => {
      findUnique.mockResolvedValue(record());

      await deleteBattlePreset('preset-1', OWNER_HASH);

      expect(remove).toHaveBeenCalledWith({ where: { id: 'preset-1' } });
    });

    it('throws BattlePresetNotFoundError instead of deleting a preset owned by a different API key', async () => {
      findUnique.mockResolvedValue(record({ apiKeyHash: OTHER_HASH }));

      await expect(deleteBattlePreset('preset-1', OWNER_HASH)).rejects.toThrow(BattlePresetNotFoundError);

      expect(remove).not.toHaveBeenCalled();
    });
  });
});
