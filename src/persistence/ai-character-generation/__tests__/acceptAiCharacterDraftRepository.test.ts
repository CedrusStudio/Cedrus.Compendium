import { beforeEach, describe, expect, it, vi } from 'vitest';

const { transaction, prisma } = vi.hoisted(() => {
  const transaction = {
    aiCharacterDraft: { findUnique: vi.fn(), updateMany: vi.fn() },
    character: { findFirst: vi.fn(), create: vi.fn(), update: vi.fn() },
    race: { findMany: vi.fn() },
    stance: { findMany: vi.fn() },
    state: { findMany: vi.fn() },
    maneuver: { findMany: vi.fn() },
    spell: { findMany: vi.fn() },
    powerSpecification: { findMany: vi.fn() },
  };

  return {
    transaction,
    prisma: { $transaction: vi.fn((callback: (value: typeof transaction) => unknown) => callback(transaction)) },
  };
});

vi.mock('@/lib/prisma', () => ({ default: prisma }));

import { acceptAiCharacterDraftInTransaction } from '@/persistence/ai-character-generation/acceptAiCharacterDraftRepository';

const emptyAllowedReferences = {
  raceIds: new Set<string>(),
  stanceIds: new Set<string>(),
  stateIds: new Set<string>(),
  maneuverIds: new Set<string>(),
  spellIds: new Set<string>(),
  powerSpecificationIds: new Set<string>(),
};

describe('acceptAiCharacterDraftInTransaction', () => {
  beforeEach(() => {
    prisma.$transaction.mockClear();
    transaction.aiCharacterDraft.findUnique.mockReset();
    transaction.character.create.mockReset();
  });

  it('is idempotent: an accepted draft returns its original character without another insert', async () => {
    transaction.aiCharacterDraft.findUnique.mockResolvedValue({
      id: 'draft-1',
      apiKeyHash: 'hash-1',
      status: 'accepted',
      acceptedCharacterId: 'character-1',
    });

    await expect(acceptAiCharacterDraftInTransaction({
      draftId: 'draft-1',
      apiKeyHash: 'hash-1',
      allowedReferences: emptyAllowedReferences,
    })).resolves.toBe('character-1');

    expect(transaction.character.create).not.toHaveBeenCalled();
  });
});
