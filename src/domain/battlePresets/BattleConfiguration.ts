// Reused as-is: ExternalParticipant has no separate domain representation
// today, it's defined alongside the battle view state in BattleCombatants.ts.
// Type-only import so this stays a compile-time reference, not a runtime
// dependency of the domain layer on the application layer.
import type { ExternalParticipant } from '@/application/bestiary/battle/BattleCombatants';

/**
 * Initiative entry for a single combatant, mirroring
 * `InitiativeEntry` in `src/persistence/slices/bestiarySlice.ts`.
 */
export type BattlePresetInitiativeEntry =
{
  initiative: number | null;
};

/**
 * Lightweight reference to a duplicated character, instead of a full frozen
 * `DuplicatedCharacter` snapshot. On `Load`, the duplicate is regenerated
 * from the *current* character data (see `createDuplicatedCharacter` in
 * `BattleCombatants.ts`), so the preset never carries stale character
 * stats. See "Ustalenia wstępne" in
 * features-to-implement/battle-configurations-implementation-plan.md.
 */
export type DuplicatedCharacterRef =
{
  id: string;
  originalCharacterId: string;
  duplicateNumber: number;
};

/**
 * Persisted shape of a battle setup — the real equivalent of the state kept
 * in `bestiarySlice` (addedToBattle / initiatives / externalParticipants /
 * duplicatedCharacters), not the `allies`/`enemies`/`settings` example from
 * the source feature document.
 */
export type BattleConfiguration =
{
  characterIds: string[];
  initiatives: Record<string, BattlePresetInitiativeEntry>;
  externalParticipants: ExternalParticipant[];
  duplicatedCharacterRefs: DuplicatedCharacterRef[];
};

export function createEmptyBattleConfiguration(): BattleConfiguration
{
  return {
    characterIds: [],
    initiatives: {},
    externalParticipants: [],
    duplicatedCharacterRefs: [],
  };
}
