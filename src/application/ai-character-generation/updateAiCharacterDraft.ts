import 'server-only';
import { hashApiKey } from '@/lib/apiKeyHash';
import type { AiCharacterProposal } from '@/domain/ai-character-generation/aiCharacterProposalSchema';
import type { AiCharacterDraft } from '@/domain/ai-character-generation/aiCharacterDraft';
import {
  getAiCharacterDraftById,
  updateAiCharacterDraftProposal,
} from '@/persistence/ai-character-generation/aiCharacterDraftRepository';
import { AiCharacterDraftNotFoundError } from '@/persistence/ai-character-generation/aiCharacterDraftErrors';
import { MongoCharacterGenerationContextSource } from '@/infrastructure/ai-character-generation/MongoCharacterGenerationContextSource';
import {
  getAiCharacterGenerationAllowedReferences,
  validateAiCharacterProposalForAcceptance,
} from '@/domain/ai-character-generation/validateAiCharacterProposalForAcceptance';
import { validateAiCharacterProposalRequirements } from '@/domain/ai-character-generation/validateAiCharacterProposalRequirements';
import { reviewAiCharacterProposalCombat } from '@/domain/ai-character-generation/reviewAiCharacterProposalCombat';
import { validateAiCharacterProposalEdit } from '@/domain/ai-character-generation/validateAiCharacterProposalEdit';
import { aiCharacterGenerationRequestSchema } from '@/domain/ai-character-generation/aiCharacterGenerationSchemas';

export class AiCharacterDraftEditRejectedError extends Error
{
  readonly issues: string[];

  constructor(issues: string[])
  {
    super('The edited AI character draft was rejected.');
    this.name = 'AiCharacterDraftEditRejectedError';
    this.issues = issues;
  }
}

/**
 * Saves a reviewer's edit of a pending draft.
 *
 * The edit is checked against the draft it claims to modify and against the
 * compendium rather than trusted: a reviewer may trim, retune and reach for a
 * record that exists, but may not invent one through this endpoint.
 *
 * The review notes are recomputed here rather than sent by the client, so what
 * the reviewer sees after saving describes the proposal they now have.
 */
export async function updateAiCharacterDraft(input: {
  draftId: string;
  apiKey: string;
  proposal: AiCharacterProposal;
}): Promise<AiCharacterDraft>
{
  const apiKeyHash = hashApiKey(input.apiKey);
  const draft = await getAiCharacterDraftById(input.draftId, apiKeyHash);
  if (!draft || !draft.proposal) throw new AiCharacterDraftNotFoundError();

  const contextSource = new MongoCharacterGenerationContextSource();
  const [references, catalogEntries, catalogRequirements] = await Promise.all([
    contextSource.loadReferences({ apiKey: input.apiKey, referenceCharacterIds: draft.referenceCharacterIds }),
    contextSource.loadCatalog(),
    contextSource.loadCatalogRequirements(),
  ]);

  // The catalog has to be read before the edit can be judged: an addition is
  // legitimate exactly when the compendium already holds the record.
  const editIssues = validateAiCharacterProposalEdit(draft.proposal, input.proposal, catalogEntries);
  if (editIssues.length > 0) throw new AiCharacterDraftEditRejectedError(editIssues);

  const constraints = aiCharacterGenerationRequestSchema.safeParse(draft.request);
  const allowCustomAbilities = constraints.success && constraints.data.constraints.allowCustomAbilities;

  const validationIssues = validateAiCharacterProposalForAcceptance(
    input.proposal,
    getAiCharacterGenerationAllowedReferences(references, catalogEntries),
    { allowCustomAbilities },
  )
    .concat(validateAiCharacterProposalRequirements(input.proposal, catalogRequirements))
    .concat(reviewAiCharacterProposalCombat(input.proposal));

  return updateAiCharacterDraftProposal({
    id: input.draftId,
    apiKeyHash,
    proposal: input.proposal,
    validationIssues,
  });
}
