import 'server-only';
import type { Character } from '@/domain/characters/Character';
import type { CharacterGenerationCatalogEntry } from '@/domain/ai-character-generation/CharacterGenerationProvider';
import type { AiCharacterRequirementIndex } from '@/domain/ai-character-generation/validateAiCharacterProposalRequirements';
import type { BalanceProfile } from '@/domain/ai-character-generation/buildBalanceProfiles';

/** A compendium entry named by a reference character, without its body text. */
export type AiCharacterGenerationReferenceEntry = {
  id: string;
  name: string;
  grade?: number;
};

/**
 * A reference character shows the model how a finished character is put
 * together. It does not need to carry the full text of every maneuver and perk
 * it holds: those same records are already in `allowedCatalog`, and repeating
 * them cost about 10 000 characters per reference — three references filled
 * half the prompt and squeezed the catalog down to its floors, leaving four
 * stances out of two hundred to choose from.
 */
export type AiCharacterGenerationReference =
  Omit<Character, 'apiKeys' | 'stances' | 'states' | 'maneuvers' | 'perks' | 'powers' | 'equipment'>
  & {
    stances: AiCharacterGenerationReferenceEntry[];
    states: AiCharacterGenerationReferenceEntry[];
    maneuvers: AiCharacterGenerationReferenceEntry[];
    perks: AiCharacterGenerationReferenceEntry[];
    powers: (AiCharacterGenerationReferenceEntry & {
      powerSpecificationId: string;
      spells: AiCharacterGenerationReferenceEntry[];
    })[];
    equipment: Record<string, AiCharacterGenerationReferenceEntry[]>;
  };

export type LoadCharacterGenerationReferencesInput = {
  apiKey: string;
  referenceCharacterIds: string[];
};

/**
 * A context source lives on the server. It resolves only references the caller
 * can see; a model adapter never receives an API key, a database client, or a
 * path to a local backup.
 */
export interface CharacterGenerationContextSource {
  loadReferences(input: LoadCharacterGenerationReferencesInput): Promise<AiCharacterGenerationReference[]>;

  /**
   * The compendium the model may choose from. It is not scoped by API key:
   * these are shared records, and the draft only ever references them — the
   * acceptance transaction re-checks every id before anything is linked.
   */
  loadCatalog(): Promise<CharacterGenerationCatalogEntry[]>;

  /**
   * Structured requirements for the same records, used to verify the draft
   * rather than to prompt with it — see `loadAiCharacterRequirements`.
   */
  loadCatalogRequirements(): Promise<AiCharacterRequirementIndex>;

  /** Measured norms per character tag — see `buildBalanceProfiles`. */
  loadBalanceProfiles(): Promise<BalanceProfile[]>;
}

function toEntry(entry: { id: string; name: string; grade?: number }): AiCharacterGenerationReferenceEntry
{
  return entry.grade === undefined
    ? { id: entry.id, name: entry.name }
    : { id: entry.id, name: entry.name, grade: entry.grade };
}

/**
 * Removes access-control metadata before a character becomes model context and
 * reduces its compendium links to identifiers and names. JSON serialization
 * intentionally produces a plain, model-safe data object.
 */
export function toAiCharacterGenerationReference(character: Character): AiCharacterGenerationReference
{
  const { apiKeys: _apiKeys, stances, states, maneuvers, perks, powers, equipment, ...rest } = character;

  const reference = {
    ...rest,
    stances: stances.map(toEntry),
    states: states.map(toEntry),
    maneuvers: maneuvers.map(toEntry),
    perks: perks.map(toEntry),
    powers: powers.map(power => ({
      ...toEntry(power),
      powerSpecificationId: power.powerSpecificationId,
      spells: power.spells.map(toEntry),
    })),
    equipment: Object.fromEntries(
      Object.entries(equipment as Record<string, { id: string; name: string }[]>)
        .map(([slot, items]) => [slot, Array.isArray(items) ? items.map(toEntry) : []]),
    ),
  };

  return JSON.parse(JSON.stringify(reference)) as AiCharacterGenerationReference;
}
