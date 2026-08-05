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
