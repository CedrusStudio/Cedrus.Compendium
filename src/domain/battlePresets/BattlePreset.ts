import { Entity } from '@/domain/Entity';
import { BattleConfiguration } from '@/domain/battlePresets/BattleConfiguration';

export type BattlePreset = Entity & {
  configuration: BattleConfiguration;
  createdAt: Date;
  updatedAt: Date;
};

/**
 * Summary shape used for list views (dropdown in the battle panel,
 * management view in Personalization) — avoids shipping the full
 * configuration payload when only the name is needed.
 */
export type BattlePresetSummary = Pick<BattlePreset, 'id' | 'name' | 'createdAt' | 'updatedAt'>;
