import type { AiCharacterProposal } from '@/domain/ai-character-generation/aiCharacterProposalSchema';
import { createPendingDraft } from '@/__tests__/fixtures/aiCharacterDraft';
import { AiCharacterDraftNotFoundError, AiCharacterDraftStateError } from '../aiCharacterDraftErrors';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { prisma } = vi.hoisted(() => ({
  prisma: {
    aiCharacterDraft: {
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}));

vi.mock('@/lib/prisma', () => ({ default: prisma }));

import {
  createAiCharacterDraft,
  getAiCharacterDraftById,
  rejectAiCharacterDraft,
  updateAiCharacterDraftProposal,
} from '@/persistence/ai-character-generation/aiCharacterDraftRepository';

const request = {
  description: 'Zwiadowca walczący łukiem i magią lodu.',
  referenceCharacterIds: [],
  constraints: { language: 'pl-PL' as const, allowCustomEquipment: false, allowCustomAbilities: false },
};

/** What Prisma returns: the domain fields plus the caller-scoping column. */
function storedRecord(overrides: Record<string, unknown> = {}) {
  return {
    id: 'draft-1',
    apiKeyHash: 'hash-1',
    status: 'pending',
    request,
    proposal: null,
    validationIssues: null,
    referenceCharacterIds: [],
    provider: 'openai',
    model: 'gpt-5.6-luna',
    promptVersion: 'v1',
    generationUsage: null,
    costMicroUsd: 0,
    expiresAt: new Date('2026-01-02T00:00:00.000Z'),
    acceptedAt: null,
    acceptedCharacterId: null,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    ...overrides,
  };
}

describe('aiCharacterDraftRepository', () => {
  beforeEach(() => {
    prisma.aiCharacterDraft.create.mockReset();
    prisma.aiCharacterDraft.findUnique.mockReset();
    prisma.aiCharacterDraft.update.mockReset();
  });

  it('maps a stored record without carrying its caller scope into the domain draft', async () => {
    prisma.aiCharacterDraft.create.mockResolvedValue(storedRecord());

    const draft = await createAiCharacterDraft({
      apiKeyHash: 'hash-1',
      request,
      provider: 'openai',
      model: 'gpt-5.6-luna',
      promptVersion: 'v1',
      expiresAt: new Date('2026-01-02T00:00:00.000Z'),
    });

    expect(draft).not.toHaveProperty('apiKeyHash');
    expect(draft.id).toBe('draft-1');
    expect(draft.validationIssues).toEqual([]);
    expect(draft.proposal).toBeNull();
  });

  it('hides a draft belonging to another caller', async () => {
    prisma.aiCharacterDraft.findUnique.mockResolvedValue(storedRecord());

    await expect(getAiCharacterDraftById('draft-1', 'someone-else')).resolves.toBeNull();
  });

  it('expires a pending draft that is past its deadline', async () => {
    prisma.aiCharacterDraft.findUnique.mockResolvedValue(storedRecord());
    prisma.aiCharacterDraft.update.mockResolvedValue(storedRecord({ status: 'expired' }));

    const draft = await getAiCharacterDraftById('draft-1', 'hash-1', new Date('2026-02-01T00:00:00.000Z'));

    expect(draft?.status).toBe('expired');
    expect(draft).not.toHaveProperty('apiKeyHash');
  });
});

describe('review lifecycle and persistence', () => {
  const db = prisma.aiCharacterDraft;
  beforeEach(() => {
    db.create.mockReset();
    db.findUnique.mockReset();
    db.update.mockReset();
  });

  it('writes the proposal, usage, review issues and zero cost for a generated draft', async () => {
    const proposal: AiCharacterProposal = JSON.parse(JSON.stringify(createPendingDraft().proposal));
    const generationUsage = { inputTokens: 12, outputTokens: 3, providerRequestId: 'mock-request' };
    const validationIssues = ['Sprawdź rangę.'];
    const input = {
      apiKeyHash: 'hash-1', request, proposal, generationUsage, validationIssues, costMicroUsd: 0,
      provider: 'openai', model: 'mock', promptVersion: 'v1', expiresAt: new Date('2026-01-02'),
    };
    db.create.mockImplementation(async ({ data }) => storedRecord(data));
    const result = await createAiCharacterDraft(input);
    expect(db.create).toHaveBeenCalledExactlyOnceWith({ data: expect.objectContaining({
      proposal, generationUsage, validationIssues, costMicroUsd: 0, apiKeyHash: 'hash-1',
    }) });
    expect(result).toMatchObject({ proposal, generationUsage, validationIssues, costMicroUsd: 0 });
    expect(result).not.toHaveProperty('apiKeyHash');
  });

  it('returns a pending draft before the deadline and leaves accepted drafts intact', async () => {
    db.findUnique.mockResolvedValueOnce(storedRecord()).mockResolvedValueOnce(storedRecord({ status: 'accepted' }));
    await expect(getAiCharacterDraftById('draft-1', 'hash-1', new Date('2026-01-01'))).resolves.toMatchObject({ status: 'pending' });
    await expect(getAiCharacterDraftById('draft-1', 'hash-1', new Date('2026-01-04'))).resolves.toMatchObject({ status: 'accepted' });
    expect(db.update).not.toHaveBeenCalled();
  });

  it.each([
    { record: null, error: AiCharacterDraftNotFoundError },
    { record: storedRecord({ apiKeyHash: 'other-owner' }), error: AiCharacterDraftNotFoundError },
    { record: storedRecord({ status: 'accepted' }), error: AiCharacterDraftStateError },
  ])('blocks review and rejection for invalid draft access (%j)', async ({ record, error }) => {
    db.findUnique.mockResolvedValue(record);
    const proposal: AiCharacterProposal = JSON.parse(JSON.stringify(createPendingDraft().proposal));
    await expect(updateAiCharacterDraftProposal({ id: 'draft-1', apiKeyHash: 'hash-1', proposal, validationIssues: [] })).rejects.toBeInstanceOf(error);
    await expect(rejectAiCharacterDraft('draft-1', 'hash-1')).rejects.toBeInstanceOf(error);
    expect(db.update).not.toHaveBeenCalled();
  });

  it('replaces the proposal and clears obsolete issues together, then rejects at most once', async () => {
    const proposal: AiCharacterProposal = JSON.parse(JSON.stringify(createPendingDraft().proposal));
    db.findUnique.mockResolvedValueOnce(storedRecord({ validationIssues: ['Stara uwaga.'] }))
      .mockResolvedValueOnce(storedRecord({ proposal })).mockResolvedValueOnce(storedRecord({ proposal, status: 'rejected' }));
    db.update.mockImplementation(async ({ data }) => storedRecord(data));
    const saved = await updateAiCharacterDraftProposal({ id: 'draft-1', apiKeyHash: 'hash-1', proposal, validationIssues: [] });
    expect(saved).toMatchObject({ proposal, validationIssues: [] });
    await rejectAiCharacterDraft('draft-1', 'hash-1');
    await rejectAiCharacterDraft('draft-1', 'hash-1');
    expect(db.update.mock.calls).toEqual([
      [{ where: { id: 'draft-1' }, data: { proposal, validationIssues: [] } }],
      [{ where: { id: 'draft-1' }, data: { status: 'rejected' } }],
    ]);
  });
});
