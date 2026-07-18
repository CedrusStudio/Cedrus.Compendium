import type { BattlePreset as PrismaBattlePreset } from '@prisma/client';
import { BattleConfiguration, createEmptyBattleConfiguration } from '@/domain/battlePresets/BattleConfiguration';
import { BattlePreset } from '@/domain/battlePresets/BattlePreset';

/**
 * `configuration` is stored as a native Prisma `Json` field (Mongo stores it
 * as a plain BSON document, no manual JSON.stringify/parse needed — unlike
 * `PersonalizationProfileRecord.profile`, which predates this convention).
 * We still defensively fall back to an empty configuration if the stored
 * value doesn't look like a `BattleConfiguration`, so a malformed/legacy
 * record can't crash the whole preset list.
 */
function toBattleConfiguration(rawConfiguration: unknown): BattleConfiguration
{
  if (!rawConfiguration || typeof rawConfiguration !== 'object')
  {
    return createEmptyBattleConfiguration();
  }

  const candidate = rawConfiguration as Partial<BattleConfiguration>;

  return {
    characterIds: Array.isArray(candidate.characterIds) ? candidate.characterIds : [],
    initiatives: typeof candidate.initiatives === 'object' && candidate.initiatives !== null ? candidate.initiatives : {},
    externalParticipants: Array.isArray(candidate.externalParticipants) ? candidate.externalParticipants : [],
    duplicatedCharacterRefs: Array.isArray(candidate.duplicatedCharacterRefs) ? candidate.duplicatedCharacterRefs : [],
  };
}

/**
 * Maps the persistence record to the domain shape. `apiKeyHash` is
 * deliberately dropped here — it's an ownership/security concern of the
 * persistence layer, not something the domain or the client needs back (the
 * client already knows its own API key via useApiKey()).
 */
export function toBattlePreset(record: PrismaBattlePreset): BattlePreset
{
  return {
    id: record.id,
    name: record.name,
    configuration: toBattleConfiguration(record.configuration),
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}
