import { beforeEach, describe, expect, it, vi } from 'vitest';

const { transaction, prisma } = vi.hoisted(() => {
  const transaction = {
    aiGenerationLedger: { findUnique: vi.fn(), update: vi.fn() },
    aiGenerationBudgetCounter: { update: vi.fn() },
  };

  return {
    transaction,
    prisma: { $transaction: vi.fn((callback: (value: typeof transaction) => unknown) => callback(transaction)) },
  };
});

vi.mock('@/lib/prisma', () => ({ default: prisma }));

import { releaseAiGenerationBudget } from '@/persistence/ai-character-generation/aiGenerationBudgetRepository';

describe('releaseAiGenerationBudget', () => {
  beforeEach(() => {
    transaction.aiGenerationLedger.findUnique.mockReset();
    transaction.aiGenerationLedger.update.mockReset();
    transaction.aiGenerationBudgetCounter.update.mockReset();
  });

  it('gives back the daily generation, not only the reserved money', async () => {
    transaction.aiGenerationLedger.findUnique.mockResolvedValue({
      id: 'ledger-1',
      apiKeyHash: 'hash-1',
      state: 'reserved',
      reservedMicroUsd: 200_000,
      dayBucketUtc: '2026-08-03',
      monthBucketUtc: '2026-08',
    });

    await releaseAiGenerationBudget('ledger-1', 'hash-1');

    // A generation that never happened must not spend one of the day's five;
    // otherwise a run of provider failures locks the feature until midnight.
    for (const call of transaction.aiGenerationBudgetCounter.update.mock.calls) {
      expect(call[0].data).toEqual({
        reservedMicroUsd: { decrement: 200_000 },
        generationCount: { decrement: 1 },
      });
    }
    expect(transaction.aiGenerationBudgetCounter.update).toHaveBeenCalledTimes(2);
  });

  it('is idempotent for an already released reservation', async () => {
    transaction.aiGenerationLedger.findUnique.mockResolvedValue({
      id: 'ledger-1',
      apiKeyHash: 'hash-1',
      state: 'released',
      reservedMicroUsd: 200_000,
      dayBucketUtc: '2026-08-03',
      monthBucketUtc: '2026-08',
    });

    await releaseAiGenerationBudget('ledger-1', 'hash-1');

    expect(transaction.aiGenerationBudgetCounter.update).not.toHaveBeenCalled();
  });
});
