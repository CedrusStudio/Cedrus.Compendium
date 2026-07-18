import { Character } from "@/domain/characters/Character";
import { Statistic } from "@prisma/client";

export type BattleCombatant = Character | ExternalParticipant | DuplicatedCharacter;

// Type guard to check if combatant is a Character
export function isCharacter(combatant: BattleCombatant): combatant is Character 
{
  return !('isExternal' in combatant) && !('isDuplicate' in combatant);
}

// Type guard to check if combatant is an ExternalParticipant
export function isExternalParticipant(combatant: BattleCombatant): combatant is ExternalParticipant 
{
  return 'isExternal' in combatant && (combatant as ExternalParticipant).isExternal === true;
}

// Type guard to check if combatant is a DuplicatedCharacter
export function isDuplicatedCharacter(combatant: BattleCombatant): combatant is DuplicatedCharacter 
{
  return 'isDuplicate' in combatant && (combatant as DuplicatedCharacter).isDuplicate === true;
}

//External Participant type and functions
export type ExternalParticipant = 
{
  id: string;
  name: string;
  maxHealth: number;
  currentInitiative: number | null;
  initiative: Statistic;
  notes?: string;
  isExternal: true; // Discriminator to distinguish from Character
};

export function createExternalParticipant
(
  name: string,
  maxHealth: number = 100,
  initiativeGrade: number = 3,
  initiativeTotalBonus: number = 0,
  notes: string = ""
)
  : ExternalParticipant 
{
  return {
    id: `ext_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`,
    name,
    maxHealth,
    currentInitiative: null,
    initiative: { grade: initiativeGrade, value: initiativeTotalBonus, bonus: 0, testBonus: 0 } as Statistic,
    notes,
    isExternal: true,
  };
}

export function updateExternalParticipant(participant: ExternalParticipant, updates: Partial<Omit<ExternalParticipant, 'id' | 'isExternal'>>)
  : ExternalParticipant 
{
  return {
    ...participant,
    ...updates,
  };
}

//Duplicated Character type and functions
export type DuplicatedCharacter = 
{
  id: string; // Unique ID with "dup_" prefix
  originalCharacterId: string; // Reference to the original character
  character: Character; // Full character data snapshot
  isDuplicate: true; // Discriminator
  duplicateNumber: number; // Which duplicate this is (2, 3, 4, etc.)
};

// Deep-clones a character and renames it for the given duplicate number.
// Shared by createDuplicatedCharacter (new duplicate, session only) and
// restoreDuplicatedCharacter (battle preset Load, see
// src/application/battlePresets) so both produce an identically-shaped
// character body from the same renaming rules.
function cloneAndRenameCharacter(sourceCharacter: Character, duplicateNumber: number): Character
{
  // Deep clone character using JSON serialization to ensure all nested objects are copied
  let duplicatedCharacter: Character;
  try
  {
    duplicatedCharacter = JSON.parse(JSON.stringify(sourceCharacter));
  }
  catch (e)
  {
    console.error('Failed to deep clone character, using shallow copy', e);
    duplicatedCharacter = { ...sourceCharacter };
  }

  // Ensure all required properties exist after cloning
  if (!duplicatedCharacter.attributes)
  {
    duplicatedCharacter.attributes = sourceCharacter.attributes;
  }
  if (!duplicatedCharacter.characteristics)
  {
    duplicatedCharacter.characteristics = sourceCharacter.characteristics;
  }
  if (!duplicatedCharacter.tags)
  {
    duplicatedCharacter.tags = sourceCharacter.tags || [];
  }
  if (!duplicatedCharacter.defenses)
  {
    duplicatedCharacter.defenses = sourceCharacter.defenses || [];
  }
  if (!duplicatedCharacter.offenses)
  {
    duplicatedCharacter.offenses = sourceCharacter.offenses || [];
  }

  // Update only the necessary fields after deep cloning
  duplicatedCharacter.name = `${sourceCharacter.name.replace(/\s+\d+$/, '')} ${duplicateNumber}`;
  duplicatedCharacter.shortName = `${sourceCharacter.shortName.replace(/\d+$/, '')}${duplicateNumber}`;

  return duplicatedCharacter;
}

// Create a duplicated character for battle session only
export function createDuplicatedCharacter
(
  sourceCharacter: Character,
  existingDuplicates: DuplicatedCharacter[],
  originalCharacterId?: string
)
  : DuplicatedCharacter
{
  const originalId = originalCharacterId ?? sourceCharacter.id;

  // Find highest duplicate number for this original character
  const sameDuplicates = existingDuplicates.filter(d => d.originalCharacterId === originalId);
  const maxDuplicateNumber = sameDuplicates.length > 0
    ? Math.max(...sameDuplicates.map(d => d.duplicateNumber))
    : 1;

  const nextNumber = maxDuplicateNumber + 1;

  return {
    id: `dup_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`,
    originalCharacterId: originalId,
    character: cloneAndRenameCharacter(sourceCharacter, nextNumber),
    isDuplicate: true,
    duplicateNumber: nextNumber,
  };
}

/**
 * Rebuilds a DuplicatedCharacter from a battle preset's lightweight
 * DuplicatedCharacterRef, using the *current* character data (fetched
 * fresh, not the frozen snapshot the preset would otherwise carry — see
 * "Ustalenia wstępne" in
 * features-to-implement/battle-configurations-implementation-plan.md).
 *
 * Unlike createDuplicatedCharacter, the id and duplicateNumber are taken
 * verbatim from the ref (not regenerated), so that initiative entries keyed
 * by the duplicate's id in the restored BattleConfiguration still resolve
 * to the right combatant after Load.
 */
export function restoreDuplicatedCharacter(sourceCharacter: Character, ref: { id: string; originalCharacterId: string; duplicateNumber: number }): DuplicatedCharacter
{
  return {
    id: ref.id,
    originalCharacterId: ref.originalCharacterId,
    character: cloneAndRenameCharacter(sourceCharacter, ref.duplicateNumber),
    isDuplicate: true,
    duplicateNumber: ref.duplicateNumber,
  };
}
