import client from '@/infrastructure/clients/baseClient';
import type { BattleConfiguration } from '@/domain/battlePresets/BattleConfiguration';
import type { BattlePreset, BattlePresetSummary } from '@/domain/battlePresets/BattlePreset';

/**
 * Wire shapes: `createdAt`/`updatedAt` travel as ISO strings over JSON, not
 * `Date` instances (unlike the domain types in
 * src/domain/battlePresets/BattlePreset.ts, which are the server-side
 * source of truth). Kept as distinct types here rather than force-fitting
 * the domain type, since no other client in this codebase serializes Date
 * fields yet — this is the first one, so it's made explicit instead of
 * silently mismatched.
 */
export type BattlePresetSummaryDto = Omit<BattlePresetSummary, 'createdAt' | 'updatedAt'> & {
  createdAt: string;
  updatedAt: string;
};

export type BattlePresetDto = Omit<BattlePreset, 'createdAt' | 'updatedAt'> & {
  createdAt: string;
  updatedAt: string;
};

const battlePresetsClient = {
  async list(): Promise<BattlePresetSummaryDto[]>
  {
    const response = await client.get<BattlePresetSummaryDto[]>('/battle-presets');
    return response.data;
  },

  async getById(id: string): Promise<BattlePresetDto>
  {
    const response = await client.get<BattlePresetDto>(`/battle-presets/${id}`);
    return response.data;
  },

  async create(name: string, configuration: BattleConfiguration): Promise<{ id: string }>
  {
    const response = await client.post<{ id: string }>('/battle-presets', { name, configuration });
    return response.data;
  },

  async update(id: string, data: { name?: string; configuration?: BattleConfiguration }): Promise<BattlePresetDto>
  {
    const response = await client.put<BattlePresetDto>(`/battle-presets/${id}`, data);
    return response.data;
  },

  async remove(id: string): Promise<void>
  {
    await client.delete(`/battle-presets/${id}`);
  },
};

export default battlePresetsClient;
