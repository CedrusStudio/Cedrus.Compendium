import { beforeEach, describe, expect, it, vi } from 'vitest';

const { transaction, prisma } = vi.hoisted(() => {
  const transaction = {
    aiGenerationBudgetCounter: {
      upsert: vi.fn(),
      update: vi.fn(),
    },
    aiGenerationLedger: {
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  };

  return {
    transaction,
    prisma: {
      $transaction: vi.fn((callback: (value: typeof transaction) => unknown) => callback(transaction)),
    },
  };
});

vi.mock('@prisma/client', () => ({
  AiGenerationBudgetPeriod: { day: 'day', month: 'month' },
  AiGenerationLedgerState: { reserved: 'reserved', completed: 'completed', released: 'released' },
}));

vi.mock('@/lib/prisma', () => ({
  default: prisma,
}));

import {
  completeAiGenerationBudget,
  reserveAiGenerationBudget,
} from '@/persistence/ai-character-generation/aiGenerationBudgetRepository';
import { AiGenerationBudgetExceededError } from '@/persistence/ai-character-generation/aiCharacterGenerationErrors';

const limits = {
  dailyLimitMicroUsd: 500_000,
  monthlyLimitMicroUsd: 5_000_000,
  maxGenerationsPerDay: 5,
  maxRequestCostMicroUsd: 200_000,
};

describe('AI generation budget repository', () => {
  beforeEach(() => {
    prisma.$transaction.mockClear();
    transaction.aiGenerationBudgetCounter.upsert.mockReset();
    transaction.aiGenerationBudgetCounter.update.mockReset();
    transaction.aiGenerationLedger.create.mockReset();
    transaction.aiGenerationLedger.findUnique.mockReset();
    transaction.aiGenerationLedger.update.mockReset();

    transaction.aiGenerationBudgetCounter.upsert
      .mockResolvedValueOnce({ id: 'day-counter', reservedMicroUsd: 0, spentMicroUsd: 0, generationCount: 0 })
      .mockResolvedValueOnce({ id: 'month-counter', reservedMicroUsd: 0, spentMicroUsd: 0, generationCount: 0 });
    transaction.aiGenerationLedger.create.mockResolvedValue({ id: 'ledger-1' });
  });

  it('reserves the maximum cost in both UTC counters before calling a provider', async () => {
    const reservation = await reserveAiGenerationBudget({
      apiKeyHash: 'hashed-key',
      provider: 'openai',
      model: 'example-model',
      limits,
      now: new Date('2026-08-02T12:00:00.000Z'),
    });

    expect(reservation).toMatchObject({
      id: 'ledger-1',
      dayBucketUtc: '2026-08-02',
      monthBucketUtc: '2026-08',
      reservedMicroUsd: 200_000,
    });
    expect(transaction.aiGenerationBudgetCounter.update).toHaveBeenCalledTimes(2);
    expect(transaction.aiGenerationBudgetCounter.update).toHaveBeenNthCalledWith(1, {
      where: { id: 'day-counter' },
      data: {
        reservedMicroUsd: { increment: 200_000 },
        generationCount: { increment: 1 },
      },
    });
    expect(transaction.aiGenerationLedger.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        apiKeyHash: 'hashed-key',
        provider: 'openai',
        model: 'example-model',
        reservedMicroUsd: 200_000,
      }),
    }));
  });

  it('does not create a reservation when the daily count has already been exhausted', async () => {
    transaction.aiGenerationBudgetCounter.upsert
      .mockReset()
      .mockResolvedValueOnce({ id: 'day-counter', reservedMicroUsd: 0, spentMicroUsd: 0, generationCount: 5 })
      .mockResolvedValueOnce({ id: 'month-counter', reservedMicroUsd: 0, spentMicroUsd: 0, generationCount: 0 });

    await expect(reserveAiGenerationBudget({
      apiKeyHash: 'hashed-key',
      provider: 'openai',
      model: 'example-model',
      limits,
      now: new Date('2026-08-02T12:00:00.000Z'),
    })).rejects.toBeInstanceOf(AiGenerationBudgetExceededError);

    expect(transaction.aiGenerationBudgetCounter.update).not.toHaveBeenCalled();
    expect(transaction.aiGenerationLedger.create).not.toHaveBeenCalled();
  });

  it('moves a completed reservation from reserved to spent in both counters', async () => {
    transaction.aiGenerationLedger.findUnique.mockResolvedValue({
      id: 'ledger-1',
      apiKeyHash: 'hashed-key',
      state: 'reserved',
      reservedMicroUsd: 200_000,
      dayBucketUtc: '2026-08-02',
      monthBucketUtc: '2026-08',
      actualMicroUsd: 0,
    });

    await completeAiGenerationBudget({
      reservationId: 'ledger-1',
      apiKeyHash: 'hashed-key',
      actualMicroUsd: 12_345,
      inputTokens: 100,
      outputTokens: 50,
    });

    expect(transaction.aiGenerationLedger.update).toHaveBeenCalledWith({
      where: { id: 'ledger-1' },
      data: {
        state: 'completed',
        actualMicroUsd: 12_345,
        inputTokens: 100,
        outputTokens: 50,
      },
    });
    expect(transaction.aiGenerationBudgetCounter.update).toHaveBeenCalledWith({
      where: {
        apiKeyHash_period_bucket: {
          apiKeyHash: 'hashed-key',
          period: 'day',
          bucket: '2026-08-02',
        },
      },
      data: {
        reservedMicroUsd: { decrement: 200_000 },
        spentMicroUsd: { increment: 12_345 },
      },
    });
  });
});
