import { Character } from '@/domain/characters/Character';
import { BattleConfiguration, DuplicatedCharacterRef } from '@/domain/battlePresets/BattleConfiguration';
import { DuplicatedCharacter, ExternalParticipant, restoreDuplicatedCharacter } from '@/application/bestiary/battle/BattleCombatants';
import { InitiativeEntry } from '@/persistence/slices/bestiarySlice';

type BestiaryBattleState = {
  addedToBattle: string[];
  initiatives: Record<string, InitiativeEntry>;
  externalParticipants: ExternalParticipant[];
  duplicatedCharacters: DuplicatedCharacter[];
};

/**
 * Builds the payload sent to the API for "Save Current"/"Save As" from the
 * live bestiarySlice state. Duplicated characters are reduced to lightweight
 * refs (id/originalCharacterId/duplicateNumber) — the full character
 * snapshot is intentionally dropped, see restoreDuplicatedCharacterRefs
 * below and "Ustalenia wstępne" in
 * battle-configurations-implementation-plan.md.
 */
export function toBattleConfiguration(state: BestiaryBattleState): BattleConfiguration
{
  return {
    characterIds: [...state.addedToBattle],
    initiatives: { ...state.initiatives },
    externalParticipants: state.externalParticipants.map(participant => ({ ...participant })),
    duplicatedCharacterRefs: state.duplicatedCharacters.map(duplicate => ({
      id: duplicate.id,
      originalCharacterId: duplicate.originalCharacterId,
      duplicateNumber: duplicate.duplicateNumber,
    })),
  };
}

/**
 * Rebuilds full DuplicatedCharacter objects on Load, from *current*
 * character data rather than a frozen snapshot. `characters` must already
 * contain the source characters for every ref's `originalCharacterId`
 * (fetch via charactersClient.getByIds on the unique set of ids first).
 *
 * A ref whose original character no longer exists (deleted since the
 * preset was saved) is skipped rather than throwing — losing one stale
 * duplicate shouldn't block restoring the rest of the battle.
 */
export function restoreDuplicatedCharacterRefs(refs: DuplicatedCharacterRef[], characters: Character[]): DuplicatedCharacter[]
{
  const charactersById = new Map(characters.map(character => [character.id, character]));

  return refs.reduce<DuplicatedCharacter[]>((restored, ref) => {
    const sourceCharacter = charactersById.get(ref.originalCharacterId);

    if (!sourceCharacter)
    {
      console.warn(`Battle preset references a duplicate of missing character ${ref.originalCharacterId}; skipping.`);
      return restored;
    }

    restored.push(restoreDuplicatedCharacter(sourceCharacter, ref));
    return restored;
  }, []);
}
