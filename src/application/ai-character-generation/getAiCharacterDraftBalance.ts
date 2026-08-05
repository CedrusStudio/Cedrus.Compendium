import 'server-only';
import { hashApiKey } from '@/lib/apiKeyHash';
import { getAiCharacterDraftById } from '@/persistence/ai-character-generation/aiCharacterDraftRepository';
import { AiCharacterDraftNotFoundError } from '@/persistence/ai-character-generation/aiCharacterDraftErrors';
import { loadAiCharacterBalanceProfiles } from '@/persistence/ai-character-generation/aiCharacterBalanceRepository';
import { selectBalanceProfiles } from '@/domain/ai-character-generation/buildBalanceProfiles';
import {
  compareToBalanceProfile,
  type BalanceComparison,
} from '@/domain/ai-character-generation/compareToBalanceProfile';

/**
 * How the draft sits against characters of its kind.
 *
 * Computed on demand rather than stored with the draft: it describes a
 * relationship between the proposal and a compendium that keeps changing, so a
 * value frozen at generation time would quietly go stale. Recomputing is a
 * single read and the answer is always about the compendium as it is now.
 */
export async function getAiCharacterDraftBalance(input: {
  draftId: string;
  apiKey: string;
}): Promise<BalanceComparison[]>
{
  const draft = await getAiCharacterDraftById(input.draftId, hashApiKey(input.apiKey));
  if (!draft) throw new AiCharacterDraftNotFoundError();
  if (!draft.proposal) return [];

  const { proposal } = draft;
  const profiles = await loadAiCharacterBalanceProfiles();

  // The character's own tags decide which profiles apply — the same signal the
  // generator used, so the review measures against what it was aiming at.
  const matching = selectBalanceProfiles(profiles, proposal.header.tags.join(' '));

  const subject = {
    attributes: proposal.statistics.attributes as unknown as Record<string, { value?: number }>,
    maneuverCount: proposal.combat.maneuvers.length,
    perkCount: proposal.perks.length,
  };

  return matching.map(profile => compareToBalanceProfile(subject, profile));
}
