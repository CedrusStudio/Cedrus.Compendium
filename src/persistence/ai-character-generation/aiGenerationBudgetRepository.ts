import 'server-only';
import { AiGenerationBudgetPeriod, AiGenerationLedgerState } from '@prisma/client';
import prisma from '@/lib/prisma';
import {
  decideAiGenerationReservation,
  getAiGenerationBudgetBuckets,
  type AiGenerationBudgetLimits,
} from '@/domain/ai-character-generation/aiGenerationBudget';
import {
  AiGenerationBudgetExceededError,
  AiGenerationReservationNotFoundError,
  AiGenerationReservationStateError,
} from '@/persistence/ai-character-generation/aiCharacterGenerationErrors';

export type ReserveAiGenerationBudgetInput = {
  apiKeyHash: string;
  provider: string;
  model: string;
  limits: AiGenerationBudgetLimits;
  now?: Date;
};

export type AiGenerationReservation = {
  id: string;
  dayBucketUtc: string;
  monthBucketUtc: string;
  reservedMicroUsd: number;
};

const MAX_TRANSACTION_RETRIES = 3;

const isRetryableTransactionConflict = (error: unknown) =>
  typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2034';

export async function reserveAiGenerationBudget(input: ReserveAiGenerationBudgetInput): Promise<AiGenerationReservation> {
  const now = input.now ?? new Date();
  const buckets = getAiGenerationBudgetBuckets(now);

  for (let attempt = 1; attempt <= MAX_TRANSACTION_RETRIES; attempt += 1) {
    try {
      return await prisma.$transaction(async transaction => {
        const dayCounter = await transaction.aiGenerationBudgetCounter.upsert({
          where: {
            apiKeyHash_period_bucket: {
              apiKeyHash: input.apiKeyHash,
              period: AiGenerationBudgetPeriod.day,
              bucket: buckets.day,
            },
          },
          create: {
            apiKeyHash: input.apiKeyHash,
            period: AiGenerationBudgetPeriod.day,
            bucket: buckets.day,
          },
          update: {},
        });
        const monthCounter = await transaction.aiGenerationBudgetCounter.upsert({
          where: {
            apiKeyHash_period_bucket: {
              apiKeyHash: input.apiKeyHash,
              period: AiGenerationBudgetPeriod.month,
              bucket: buckets.month,
            },
          },
          create: {
            apiKeyHash: input.apiKeyHash,
            period: AiGenerationBudgetPeriod.month,
            bucket: buckets.month,
          },
          update: {},
        });

        const decision = decideAiGenerationReservation({
          day: dayCounter,
          month: monthCounter,
          limits: input.limits,
        });
        if (!decision.allowed) {
          throw new AiGenerationBudgetExceededError(decision.reason);
        }

        const reservedMicroUsd = input.limits.maxRequestCostMicroUsd;
        await transaction.aiGenerationBudgetCounter.update({
          where: { id: dayCounter.id },
          data: {
            reservedMicroUsd: { increment: reservedMicroUsd },
            generationCount: { increment: 1 },
          },
        });
        await transaction.aiGenerationBudgetCounter.update({
          where: { id: monthCounter.id },
          data: {
            reservedMicroUsd: { increment: reservedMicroUsd },
            generationCount: { increment: 1 },
          },
        });

        const ledger = await transaction.aiGenerationLedger.create({
          data: {
            apiKeyHash: input.apiKeyHash,
            provider: input.provider,
            model: input.model,
            dayBucketUtc: buckets.day,
            monthBucketUtc: buckets.month,
            reservedMicroUsd,
          },
        });

        return {
          id: ledger.id,
          dayBucketUtc: buckets.day,
          monthBucketUtc: buckets.month,
          reservedMicroUsd,
        };
      });
    } catch (error) {
      if (attempt < MAX_TRANSACTION_RETRIES && isRetryableTransactionConflict(error)) {
        continue;
      }
      throw error;
    }
  }

  throw new Error('Unreachable AI generation reservation state.');
}

export async function completeAiGenerationBudget(input: {
  reservationId: string;
  apiKeyHash: string;
  actualMicroUsd: number;
  inputTokens: number;
  outputTokens: number;
}): Promise<void> {
  if (!Number.isInteger(input.actualMicroUsd) || input.actualMicroUsd < 0) {
    throw new AiGenerationReservationStateError('Actual AI generation cost must be a non-negative integer.');
  }

  await prisma.$transaction(async transaction => {
    const ledger = await transaction.aiGenerationLedger.findUnique({ where: { id: input.reservationId } });
    if (!ledger || ledger.apiKeyHash !== input.apiKeyHash) {
      throw new AiGenerationReservationNotFoundError();
    }
    if (ledger.state === AiGenerationLedgerState.completed) {
      if (ledger.actualMicroUsd !== input.actualMicroUsd) {
        throw new AiGenerationReservationStateError('Completed reservation cost does not match the requested cost.');
      }
      return;
    }
    if (ledger.state !== AiGenerationLedgerState.reserved) {
      throw new AiGenerationReservationStateError('Only a reserved AI generation can be completed.');
    }
    if (input.actualMicroUsd > ledger.reservedMicroUsd) {
      throw new AiGenerationReservationStateError('Actual AI generation cost exceeds the reserved maximum.');
    }

    await transaction.aiGenerationLedger.update({
      where: { id: ledger.id },
      data: {
        state: AiGenerationLedgerState.completed,
        actualMicroUsd: input.actualMicroUsd,
        inputTokens: input.inputTokens,
        outputTokens: input.outputTokens,
      },
    });
    await transaction.aiGenerationBudgetCounter.update({
      where: {
        apiKeyHash_period_bucket: {
          apiKeyHash: input.apiKeyHash,
          period: AiGenerationBudgetPeriod.day,
          bucket: ledger.dayBucketUtc,
        },
      },
      data: {
        reservedMicroUsd: { decrement: ledger.reservedMicroUsd },
        spentMicroUsd: { increment: input.actualMicroUsd },
      },
    });
    await transaction.aiGenerationBudgetCounter.update({
      where: {
        apiKeyHash_period_bucket: {
          apiKeyHash: input.apiKeyHash,
          period: AiGenerationBudgetPeriod.month,
          bucket: ledger.monthBucketUtc,
        },
      },
      data: {
        reservedMicroUsd: { decrement: ledger.reservedMicroUsd },
        spentMicroUsd: { increment: input.actualMicroUsd },
      },
    });
  });
}

export async function releaseAiGenerationBudget(reservationId: string, apiKeyHash: string): Promise<void> {
  await prisma.$transaction(async transaction => {
    const ledger = await transaction.aiGenerationLedger.findUnique({ where: { id: reservationId } });
    if (!ledger || ledger.apiKeyHash !== apiKeyHash) {
      throw new AiGenerationReservationNotFoundError();
    }
    if (ledger.state === AiGenerationLedgerState.released) return;
    if (ledger.state !== AiGenerationLedgerState.reserved) {
      throw new AiGenerationReservationStateError('Only a reserved AI generation can be released.');
    }

    await transaction.aiGenerationLedger.update({
      where: { id: ledger.id },
      data: { state: AiGenerationLedgerState.released },
    });
    // The count is released along with the money. It is incremented when the
    // reservation is taken, before the provider is called, so leaving it behind
    // makes every failed attempt spend one of the day's generations — an
    // afternoon of provider errors locks the feature out without a single
    // character having been produced.
    await transaction.aiGenerationBudgetCounter.update({
      where: {
        apiKeyHash_period_bucket: {
          apiKeyHash,
          period: AiGenerationBudgetPeriod.day,
          bucket: ledger.dayBucketUtc,
        },
      },
      data: {
        reservedMicroUsd: { decrement: ledger.reservedMicroUsd },
        generationCount: { decrement: 1 },
      },
    });
    await transaction.aiGenerationBudgetCounter.update({
      where: {
        apiKeyHash_period_bucket: {
          apiKeyHash,
          period: AiGenerationBudgetPeriod.month,
          bucket: ledger.monthBucketUtc,
        },
      },
      data: {
        reservedMicroUsd: { decrement: ledger.reservedMicroUsd },
        generationCount: { decrement: 1 },
      },
    });
  });
}
