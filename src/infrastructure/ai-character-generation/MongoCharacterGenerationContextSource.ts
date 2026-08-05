import 'server-only';
import {
  type AiCharacterGenerationReference,
  type CharacterGenerationContextSource,
  type LoadCharacterGenerationReferencesInput,
  toAiCharacterGenerationReference,
} from '@/domain/ai-character-generation/CharacterGenerationContextSource';
import type { CharacterGenerationCatalogEntry } from '@/domain/ai-character-generation/CharacterGenerationProvider';
import { getCharactersVisibleToApiKeyByIds } from '@/persistence/characters/charactersRepository';
import { loadAiCharacterCatalog, loadAiCharacterRequirements } from '@/persistence/ai-character-generation/aiCharacterCatalogRepository';
import type { AiCharacterRequirementIndex } from '@/domain/ai-character-generation/validateAiCharacterProposalRequirements';
import type { BalanceProfile } from '@/domain/ai-character-generation/buildBalanceProfiles';
import { loadAiCharacterBalanceProfiles } from '@/persistence/ai-character-generation/aiCharacterBalanceRepository';

export class AiCharacterReferenceUnavailableError extends Error
{
  constructor()
  {
    super('Co najmniej jedna postać referencyjna nie jest dostępna.');
    this.name = 'AiCharacterReferenceUnavailableError';
  }
}

/**
 * Production source for references. It uses the application database instead
 * of letting the browser or an external provider inspect the local backup
 * directory. A future backup source must implement the same interface.
 */
export class MongoCharacterGenerationContextSource implements CharacterGenerationContextSource
{
  async loadReferences(input: LoadCharacterGenerationReferencesInput): Promise<AiCharacterGenerationReference[]>
  {
    if (input.referenceCharacterIds.length === 0) return [];

    const characters = await getCharactersVisibleToApiKeyByIds(input.referenceCharacterIds, input.apiKey);
    const charactersById = new Map(characters.map(character => [character.id, character]));

    if (charactersById.size !== input.referenceCharacterIds.length
      || input.referenceCharacterIds.some(id => !charactersById.has(id)))
    {
      // Do not disclose whether an unavailable id is missing or merely private.
      throw new AiCharacterReferenceUnavailableError();
    }

    return input.referenceCharacterIds
      .map(id => toAiCharacterGenerationReference(charactersById.get(id)!));
  }

  async loadCatalog(): Promise<CharacterGenerationCatalogEntry[]>
  {
    return loadAiCharacterCatalog();
  }

  async loadCatalogRequirements(): Promise<AiCharacterRequirementIndex>
  {
    return loadAiCharacterRequirements();
  }

  async loadBalanceProfiles(): Promise<BalanceProfile[]>
  {
    return loadAiCharacterBalanceProfiles();
  }
}
