import 'server-only';
import { aiCharacterProposalSchema } from '@/domain/ai-character-generation/aiCharacterProposalSchema';
import prisma from '@/lib/prisma';
import { hashApiKey } from '@/lib/apiKeyHash';
import { characterVisibilityWhere } from '@/persistence/characterVisibility';
import { creationRevision } from '@/persistence/mcp/changeIdentity';
import { unavailable } from './errors';

export async function readCreation(id: string, key: string) {
  const draft = await prisma.aiCharacterDraft.findFirst({ where: { id, apiKeyHash: hashApiKey(key), provider: 'mcp' } });
  if (!draft) return unavailable();
  const requiredIds = draft.acceptedCharacterId ? [draft.acceptedCharacterId] : draft.referenceCharacterIds;
  if (requiredIds.length && await prisma.character.count({ where: { AND: [
    { id: { in: requiredIds } }, characterVisibilityWhere(key),
  ] } }) !== requiredIds.length) return unavailable();
  const expired = draft.status === 'pending' && draft.expiresAt <= new Date();
  const parsed = aiCharacterProposalSchema.safeParse(draft.proposal);
  const proposal = parsed.success ? parsed.data : undefined;
  const summary = proposal && { name: proposal.header.name, shortName: proposal.header.shortName, description: proposal.header.description,
    tags: proposal.header.tags, maneuvers: proposal.combat.maneuvers.length, perks: proposal.perks.length,
    spells: proposal.combat.powers.reduce((count, power) => count + power.spells.length, 0) };
  const notes = Array.isArray(draft.validationIssues) ? draft.validationIssues.filter((note): note is string => typeof note === 'string') : [];
  return { changeId: id, revision: creationRevision(draft), status: expired ? 'expired' : draft.status,
    visibility: draft.mcpVisibility, summary, proposal: draft.proposal, warnings: [...new Set([...(proposal?.warnings ?? []), ...notes])], expiresAt: draft.expiresAt,
    characterId: draft.acceptedCharacterId, href: draft.acceptedCharacterId ? '/characters/' + draft.acceptedCharacterId : undefined };
}
