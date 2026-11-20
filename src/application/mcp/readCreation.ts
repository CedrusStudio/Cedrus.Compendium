import 'server-only';
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
  return { changeId: id, revision: creationRevision(draft), status: expired ? 'expired' : draft.status,
    visibility: draft.mcpVisibility, proposal: draft.proposal, warnings: draft.validationIssues, expiresAt: draft.expiresAt,
    characterId: draft.acceptedCharacterId, href: draft.acceptedCharacterId ? '/characters/' + draft.acceptedCharacterId : undefined };
}
