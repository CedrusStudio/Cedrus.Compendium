import 'server-only';
import type { Prisma } from '@prisma/client';
import { creationRevision } from '@/persistence/mcp/changeIdentity';
import prisma from '@/lib/prisma';
import {
  aiCharacterGenerationRequestSchema,
  aiCharacterGenerationUsageSchema,
  type AiCharacterGenerationRequest,
  type AiCharacterGenerationUsage,
} from '@/domain/ai-character-generation/aiCharacterGenerationSchemas';
import {
  aiCharacterProposalSchema,
  type AiCharacterProposal,
} from '@/domain/ai-character-generation/aiCharacterProposalSchema';
import { aiCharacterDraftSchema, type AiCharacterDraft } from '@/domain/ai-character-generation/aiCharacterDraft';
import { AiCharacterDraftNotFoundError, AiCharacterDraftStateError } from '@/persistence/ai-character-generation/aiCharacterDraftErrors';

const asJson = (value: unknown) => JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;

/**
 * Fields are copied one by one rather than spread: the stored record also
 * carries `apiKeyHash`, which scopes the draft to a caller and must never
 * cross into the domain object. The draft schema is `.strict()`, so spreading
 * the record fails the parse outright.
 */
const toDraft = (record: {
  id: string;
  status: string;
  request: unknown;
  proposal: unknown;
  validationIssues: unknown;
  referenceCharacterIds: string[];
  mcpVisibility?: string | null;
  provider: string;
  model: string;
  promptVersion: string;
  generationUsage: unknown;
  costMicroUsd: number;
  expiresAt: Date;
  acceptedAt: Date | null;
  acceptedCharacterId: string | null;
  createdAt: Date;
  updatedAt: Date;
}): AiCharacterDraft => aiCharacterDraftSchema.parse({
  id: record.id,
  status: record.status,
  request: record.request,
  proposal: record.proposal ?? null,
  validationIssues: record.validationIssues ?? [],
  referenceCharacterIds: record.referenceCharacterIds,
  ...(record.provider === 'mcp' && { reviewedRevision: creationRevision(record), visibility: record.mcpVisibility ?? 'mine' }),
  provider: record.provider,
  model: record.model,
  promptVersion: record.promptVersion,
  generationUsage: record.generationUsage ?? null,
  costMicroUsd: record.costMicroUsd,
  expiresAt: record.expiresAt,
  acceptedAt: record.acceptedAt,
  acceptedCharacterId: record.acceptedCharacterId,
  createdAt: record.createdAt,
  updatedAt: record.updatedAt,
});

export async function createAiCharacterDraft(input: {
  apiKeyHash: string;
  request: AiCharacterGenerationRequest;
  proposal?: AiCharacterProposal;
  validationIssues?: string[];
  provider: string;
  model: string;
  promptVersion: string;
  generationUsage?: AiCharacterGenerationUsage;
  costMicroUsd?: number;
  expiresAt: Date;
}): Promise<AiCharacterDraft> {
  const request = aiCharacterGenerationRequestSchema.parse(input.request);
  const proposal = input.proposal ? aiCharacterProposalSchema.parse(input.proposal) : undefined;
  const generationUsage = input.generationUsage ? aiCharacterGenerationUsageSchema.parse(input.generationUsage) : undefined;

  const record = await prisma.aiCharacterDraft.create({
    data: {
      apiKeyHash: input.apiKeyHash,
      request: asJson(request),
      ...(proposal ? { proposal: asJson(proposal) } : {}),
      ...(input.validationIssues?.length ? { validationIssues: asJson(input.validationIssues) } : {}),
      referenceCharacterIds: request.referenceCharacterIds,
      provider: input.provider,
      model: input.model,
      promptVersion: input.promptVersion,
      ...(generationUsage ? { generationUsage: asJson(generationUsage) } : {}),
      ...(input.costMicroUsd !== undefined ? { costMicroUsd: input.costMicroUsd } : {}),
      expiresAt: input.expiresAt,
    },
  });

  return toDraft(record);
}

export async function getAiCharacterDraftById(id: string, apiKeyHash: string, now = new Date()): Promise<AiCharacterDraft | null> {
  const record = await prisma.aiCharacterDraft.findUnique({ where: { id } });
  if (!record || record.apiKeyHash !== apiKeyHash) return null;

  if (record.status === 'pending' && record.expiresAt <= now) {
    const expired = await prisma.aiCharacterDraft.update({
      where: { id: record.id, ...(record.provider === 'mcp' && { status: 'pending' }) },
      data: { status: 'expired' },
    });
    return toDraft(expired);
  }

  return toDraft(record);
}

/**
 * Replaces a pending draft's proposal after a review edit.
 *
 * `validationIssues` is rewritten in the same update: the notes describe the
 * proposal, so leaving the old ones behind would show the reviewer problems
 * they have just fixed.
 */
export async function updateAiCharacterDraftProposal(input: {
  id: string;
  apiKeyHash: string;
  proposal: AiCharacterProposal;
  validationIssues: string[];
}): Promise<AiCharacterDraft> {
  const proposal = aiCharacterProposalSchema.parse(input.proposal);

  const record = await prisma.aiCharacterDraft.findUnique({ where: { id: input.id } });
  if (!record || record.apiKeyHash !== input.apiKeyHash) {
    throw new AiCharacterDraftNotFoundError();
  }
  if (record.status !== 'pending') {
    throw new AiCharacterDraftStateError('Only a pending AI character draft can be edited.');
  }

  const updated = await prisma.aiCharacterDraft.update({
    where: { id: input.id, ...(record.provider === 'mcp' && { apiKeyHash: input.apiKeyHash, status: 'pending', updatedAt: record.updatedAt, expiresAt: { gt: new Date() } }) },
    data: {
      proposal: asJson(proposal),
      validationIssues: asJson(input.validationIssues),
    },
  });

  return toDraft(updated);
}

export async function rejectAiCharacterDraft(id: string, apiKeyHash: string): Promise<void> {
  const record = await prisma.aiCharacterDraft.findUnique({ where: { id } });
  if (!record || record.apiKeyHash !== apiKeyHash) {
    throw new AiCharacterDraftNotFoundError();
  }
  if (record.status === 'accepted') {
    throw new AiCharacterDraftStateError('An accepted AI character draft cannot be rejected.');
  }
  if (record.status === 'rejected') return;

  await prisma.aiCharacterDraft.update({
    where: { id, ...(record.provider === 'mcp' && { status: { not: 'accepted' } }) },
    data: { status: 'rejected' },
  });
}
