import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createPendingDraft } from '@/__tests__/fixtures/aiCharacterDraft';
import { AiCharacterDraftAcceptanceConflictError } from '../aiCharacterDraftAcceptanceErrors';
import { AiCharacterDraftNotFoundError, AiCharacterDraftStateError } from '../aiCharacterDraftErrors';

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
    weapon: { findMany: vi.fn() },
    armor: { findMany: vi.fn() },
    shield: { findMany: vi.fn() },
    inventoryItem: { findMany: vi.fn() },
    mount: { findMany: vi.fn() },
    perk: { findMany: vi.fn() },
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

function pendingRecord()
{
  return { ...createPendingDraft(), apiKeyHash: 'hash-1', expiresAt: new Date(Date.now() + 60_000) };
}

function accept()
{
  return acceptAiCharacterDraftInTransaction({
    draftId: 'draft-review', apiKeyHash: 'hash-1', allowedReferences: emptyAllowedReferences,
  });
}

describe('acceptAiCharacterDraftInTransaction', () => {
  beforeEach(() => {
    prisma.$transaction.mockClear();
    transaction.aiCharacterDraft.findUnique.mockReset();
    transaction.character.findFirst.mockReset().mockResolvedValue(null);
    transaction.character.create.mockReset().mockResolvedValue({ id: 'created-character' });
    transaction.character.update.mockReset().mockResolvedValue(undefined);
    transaction.aiCharacterDraft.updateMany.mockReset().mockResolvedValue({ count: 1 });
    for (const model of [
      transaction.race, transaction.stance, transaction.state, transaction.maneuver, transaction.spell,
      transaction.powerSpecification, transaction.weapon, transaction.armor, transaction.shield,
      transaction.inventoryItem, transaction.mount, transaction.perk,
    ]) {
      model.findMany.mockReset().mockResolvedValue([]);
    }
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

  it.each([
    [null],
    [{ id: 'draft-review', apiKeyHash: 'different-owner', status: 'pending' }],
  ])('does not reveal or insert a missing or foreign draft (%j)', async record => {
    transaction.aiCharacterDraft.findUnique.mockResolvedValue(record);
    await expect(accept()).rejects.toBeInstanceOf(AiCharacterDraftNotFoundError);
    expect(transaction.character.create).not.toHaveBeenCalled();
  });

  it('rejects expired and non-pending drafts before checking relations', async () => {
    transaction.aiCharacterDraft.findUnique.mockResolvedValueOnce({
      ...pendingRecord(), status: 'rejected',
    }).mockResolvedValueOnce({
      ...pendingRecord(), expiresAt: new Date(0),
    });

    await expect(accept()).rejects.toThrow('Only a pending AI character draft can be accepted.');
    await expect(accept()).rejects.toThrow('This AI character draft has expired.');
    expect(transaction.race.findMany).not.toHaveBeenCalled();
    expect(transaction.character.create).not.toHaveBeenCalled();
  });

  it('rejects invalid proposals and conflicting names before inserting', async () => {
    transaction.aiCharacterDraft.findUnique.mockResolvedValueOnce({ ...pendingRecord(), proposal: {} })
      .mockResolvedValueOnce(pendingRecord());
    transaction.character.findFirst.mockResolvedValue({ id: 'existing-character' });

    await expect(accept()).rejects.toBeInstanceOf(AiCharacterDraftAcceptanceConflictError);
    await expect(accept()).rejects.toBeInstanceOf(AiCharacterDraftAcceptanceConflictError);
    expect(transaction.character.findFirst).toHaveBeenCalledTimes(1);
    expect(transaction.character.create).not.toHaveBeenCalled();
  });

  it('drops a removed race and records acceptance with the inserted character in the transaction', async () => {
    const draft = pendingRecord();
    if (!draft.proposal) throw new Error('Fixture requires a valid proposal');
    draft.proposal.header.raceId = 'removed-race';
    transaction.aiCharacterDraft.findUnique.mockResolvedValue(draft);

    await expect(accept()).resolves.toBe('created-character');
    expect(transaction.race.findMany).toHaveBeenCalledWith({
      where: { id: { in: ['removed-race'] } }, select: { id: true },
    });
    expect(transaction.character.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ name: draft.proposal.header.name }),
    }));
    expect(transaction.character.create.mock.calls[0]?.[0].data.race).toBeUndefined();
    expect(transaction.character.update).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'created-character' },
      data: expect.objectContaining({ talents: draft.proposal.talents.talents }),
    }));
    expect(transaction.aiCharacterDraft.updateMany).toHaveBeenCalledExactlyOnceWith({
      where: { id: 'draft-review', apiKeyHash: 'hash-1', status: 'pending' },
      data: { status: 'accepted', acceptedAt: expect.any(Date), acceptedCharacterId: 'created-character' },
    });
  });

  it('rejects inside the transaction when the conditional draft update loses the race', async () => {
    transaction.aiCharacterDraft.findUnique.mockResolvedValue(pendingRecord());
    transaction.aiCharacterDraft.updateMany.mockResolvedValue({ count: 0 });

    await expect(accept()).rejects.toBeInstanceOf(AiCharacterDraftStateError);
    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(transaction.character.create).toHaveBeenCalledTimes(1);
    expect(transaction.aiCharacterDraft.updateMany).toHaveBeenCalledTimes(1);
  });
});
