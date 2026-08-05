import 'server-only';
import { hashApiKey } from '@/lib/apiKeyHash';
import { getAiCharacterDraftById } from '@/persistence/ai-character-generation/aiCharacterDraftRepository';
import { AiCharacterDraftNotFoundError } from '@/persistence/ai-character-generation/aiCharacterDraftErrors';
import { MongoCharacterGenerationContextSource } from '@/infrastructure/ai-character-generation/MongoCharacterGenerationContextSource';
import { getAiCharacterGenerationAllowedReferences } from '@/domain/ai-character-generation/validateAiCharacterProposalForAcceptance';
import { acceptAiCharacterDraftInTransaction } from '@/persistence/ai-character-generation/acceptAiCharacterDraftRepository';

/**
 * Re-loads the caller-visible reference set before the transaction. The raw
 * API key exists only for this authorization check; the database stores only
 * its hash, which is used by the transactional acceptance operation.
 */
export async function acceptAiCharacterDraft(input: { draftId: string; apiKey: string }): Promise<string>
{
  const apiKeyHash = hashApiKey(input.apiKey);
  const draft = await getAiCharacterDraftById(input.draftId, apiKeyHash);
  if (!draft) throw new AiCharacterDraftNotFoundError();
  if (draft.status === 'accepted' && draft.acceptedCharacterId) return draft.acceptedCharacterId;

  // The compendium is reloaded rather than trusted from generation time: an
  // entry may have been renamed or removed while the draft sat in review, and
  // the transaction re-checks every identifier anyway.
  const contextSource = new MongoCharacterGenerationContextSource();
  const [references, catalogEntries] = await Promise.all([
    contextSource.loadReferences({
      apiKey: input.apiKey,
      referenceCharacterIds: draft.referenceCharacterIds,
    }),
    contextSource.loadCatalog(),
  ]);

  return acceptAiCharacterDraftInTransaction({
    draftId: input.draftId,
    apiKeyHash,
    allowedReferences: getAiCharacterGenerationAllowedReferences(references, catalogEntries),
  });
}
