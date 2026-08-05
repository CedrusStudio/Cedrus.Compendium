import 'server-only';
import { aiCharacterGenerationSettings } from '@/lib/env';
import { hashApiKey } from '@/lib/apiKeyHash';
import type { AiCharacterGenerationRequest } from '@/domain/ai-character-generation/aiCharacterGenerationSchemas';
import { buildCharacterGenerationContext } from '@/domain/ai-character-generation/buildCharacterGenerationContext';
import {
  getAiCharacterGenerationAllowedReferences,
  validateAiCharacterProposalForAcceptance,
} from '@/domain/ai-character-generation/validateAiCharacterProposalForAcceptance';
import { validateAiCharacterProposalRequirements } from '@/domain/ai-character-generation/validateAiCharacterProposalRequirements';
import { reviewAiCharacterProposalCombat } from '@/domain/ai-character-generation/reviewAiCharacterProposalCombat';
import { decideProposalRepair, keepBetterAttempt } from '@/domain/ai-character-generation/planProposalRepair';
import type { AiCharacterProposal } from '@/domain/ai-character-generation/aiCharacterProposalSchema';
import { MongoCharacterGenerationContextSource } from '@/infrastructure/ai-character-generation/MongoCharacterGenerationContextSource';
import { loadAiCharacterRulebookFragments } from '@/persistence/ai-character-generation/aiCharacterRulebookContext';
import { createCharacterGenerationProvider } from '@/infrastructure/ai-character-generation/createCharacterGenerationProvider';
import {
  completeAiGenerationBudget,
  releaseAiGenerationBudget,
  reserveAiGenerationBudget,
} from '@/persistence/ai-character-generation/aiGenerationBudgetRepository';
import {
  createAiCharacterDraft,
  rejectAiCharacterDraft,
} from '@/persistence/ai-character-generation/aiCharacterDraftRepository';

export class AiCharacterGenerationCostLimitError extends Error
{
  constructor()
  {
    super('AI character generation exceeded the application request-cost limit.');
    this.name = 'AiCharacterGenerationCostLimitError';
  }
}

/**
 * Orchestrates a draft only. It never creates a Character. The reservation is
 * taken before the paid call and released on any failure; an accepted draft is
 * still a separate, future user action.
 */
export async function generateAiCharacterDraft(input: {
  apiKey: string;
  request: AiCharacterGenerationRequest;
})
{
  const apiKeyHash = hashApiKey(input.apiKey);
  const provider = createCharacterGenerationProvider();
  const contextSource = new MongoCharacterGenerationContextSource();
  const [references, catalogEntries, catalogRequirements, balanceProfiles] = await Promise.all([
    contextSource.loadReferences({
      apiKey: input.apiKey,
      referenceCharacterIds: input.request.referenceCharacterIds,
    }),
    contextSource.loadCatalog(),
    contextSource.loadCatalogRequirements(),
    contextSource.loadBalanceProfiles(),
  ]);
  const context = buildCharacterGenerationContext(input.request, references, {
    catalogEntries,
    rulebookFragments: loadAiCharacterRulebookFragments(input.request.description),
    balanceProfiles,
    catalogRequirements,
  });
  const reservation = await reserveAiGenerationBudget({
    apiKeyHash,
    provider: provider.name,
    model: provider.model,
    limits: {
      dailyLimitMicroUsd: aiCharacterGenerationSettings.dailyLimitMicroUsd,
      monthlyLimitMicroUsd: aiCharacterGenerationSettings.monthlyLimitMicroUsd,
      maxGenerationsPerDay: aiCharacterGenerationSettings.maxGenerationsPerDay,
      maxRequestCostMicroUsd: aiCharacterGenerationSettings.maxRequestCostMicroUsd,
    },
  });

  // The same rules the acceptance transaction enforces, run now so a broken
  // reference shows up in the review instead of ambushing the user as a hard
  // error after they have already approved the draft.
  const review = (proposal: AiCharacterProposal) => validateAiCharacterProposalForAcceptance(
    proposal,
    getAiCharacterGenerationAllowedReferences(references, catalogEntries),
    { allowCustomAbilities: input.request.constraints.allowCustomAbilities },
  ).concat(
    // Reported, never blocking: taking an entry without meeting its
    // requirements is a call the game master is allowed to make.
    validateAiCharacterProposalRequirements(proposal, catalogRequirements),
  ).concat(
    reviewAiCharacterProposalCombat(proposal),
  );

  let draftId: string | undefined;
  try {
    let result = await provider.generate(context);

    if (result.costMicroUsd > reservation.reservedMicroUsd) {
      throw new AiCharacterGenerationCostLimitError();
    }

    let validationIssues = review(result.proposal);

    // Second pass: the review notes already exist, so handing them back costs
    // one call and removes a class of fault the prompt alone never closed. The
    // repair is not trusted to be better — it is reviewed the same way and kept
    // only if it actually fixed more than it broke.
    const decision = decideProposalRepair({
      issues: validationIssues,
      budget: { spentMicroUsd: result.costMicroUsd, reservedMicroUsd: reservation.reservedMicroUsd },
    });

    if (decision.attempt && provider.repair) {
      try {
        const repaired = await provider.repair(context, { proposal: result.proposal, issues: decision.issues });
        const repairedIssues = review(repaired.proposal);
        const { chosen, improved } = keepBetterAttempt(
          { proposal: result.proposal, issues: validationIssues },
          { proposal: repaired.proposal, issues: repairedIssues },
        );

        validationIssues = chosen.issues;
        result = {
          // The draft that is kept, but the cost and tokens of both calls: the
          // budget has to account for what was spent, not for what was used.
          ...(improved ? repaired : result),
          proposal: chosen.proposal,
          costMicroUsd: result.costMicroUsd + repaired.costMicroUsd,
          usage: {
            ...repaired.usage,
            inputTokens: result.usage.inputTokens + repaired.usage.inputTokens,
            outputTokens: result.usage.outputTokens + repaired.usage.outputTokens,
          },
        };
      } catch (error) {
        // A failed repair is not a failed generation. The first draft is still
        // a usable draft, and losing it because the second call timed out would
        // charge the user for nothing.
        console.error('AI character draft repair failed; keeping the first attempt:', error);
      }
    }

    if (result.costMicroUsd > reservation.reservedMicroUsd) {
      throw new AiCharacterGenerationCostLimitError();
    }

    const draft = await createAiCharacterDraft({
      apiKeyHash,
      request: input.request,
      proposal: result.proposal,
      validationIssues,
      provider: provider.name,
      model: provider.model,
      promptVersion: 'character-draft-v1',
      generationUsage: result.usage,
      costMicroUsd: result.costMicroUsd,
      expiresAt: new Date(Date.now() + aiCharacterGenerationSettings.draftTtlHours * 60 * 60 * 1_000),
    });
    draftId = draft.id;

    await completeAiGenerationBudget({
      reservationId: reservation.id,
      apiKeyHash,
      actualMicroUsd: result.costMicroUsd,
      inputTokens: result.usage.inputTokens,
      outputTokens: result.usage.outputTokens,
    });

    return draft;
  } catch (error) {
    if (draftId) {
      await rejectAiCharacterDraft(draftId, apiKeyHash).catch(() => undefined);
    }
    await releaseAiGenerationBudget(reservation.id, apiKeyHash).catch(() => undefined);
    throw error;
  }
}
