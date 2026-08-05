import { describe, expect, it } from 'vitest';
import {
  decideAiGenerationReservation,
  getAiGenerationBudgetBuckets,
} from '@/domain/ai-character-generation/aiGenerationBudget';
import { aiCharacterGenerationRequestSchema } from '@/domain/ai-character-generation/aiCharacterGenerationSchemas';

const limits = {
  dailyLimitMicroUsd: 500_000,
  monthlyLimitMicroUsd: 5_000_000,
  maxGenerationsPerDay: 5,
  maxRequestCostMicroUsd: 200_000,
};

const emptyCounter = {
  reservedMicroUsd: 0,
  spentMicroUsd: 0,
  generationCount: 0,
};

describe('AI character generation request schema', () => {
  it('trims the description and supplies safe defaults', () => {
    const result = aiCharacterGenerationRequestSchema.parse({
      description: '  Zwiadowca walczący łukiem i magią lodu.  ',
    });

    expect(result).toEqual({
      description: 'Zwiadowca walczący łukiem i magią lodu.',
      referenceCharacterIds: [],
      // Authoring permissions default to off: an unstated request must never
      // give a model licence to write into the shared compendium.
      constraints: { language: 'pl-PL', allowCustomEquipment: false, allowCustomAbilities: false },
    });
  });

  it('rejects a repeated character reference', () => {
    const result = aiCharacterGenerationRequestSchema.safeParse({
      description: 'Zwiadowca walczący łukiem i magią lodu.',
      referenceCharacterIds: ['character-a', 'character-a'],
    });

    expect(result.success).toBe(false);
  });

  it('rejects more than three references and unknown fields', () => {
    const result = aiCharacterGenerationRequestSchema.safeParse({
      description: 'Zwiadowca walczący łukiem i magią lodu.',
      referenceCharacterIds: ['a', 'b', 'c', 'd'],
      unexpected: true,
    });

    expect(result.success).toBe(false);
  });
});

describe('AI generation budget decision', () => {
  it('uses UTC date buckets rather than local time', () => {
    expect(getAiGenerationBudgetBuckets(new Date('2026-08-02T23:30:00.000Z'))).toEqual({
      day: '2026-08-02',
      month: '2026-08',
    });
  });

  it('allows a bounded reservation within both limits', () => {
    expect(decideAiGenerationReservation({
      day: emptyCounter,
      month: emptyCounter,
      limits,
    })).toEqual({ allowed: true });
  });

  it('blocks another generation once the daily request count is exhausted', () => {
    expect(decideAiGenerationReservation({
      day: { ...emptyCounter, generationCount: 5 },
      month: emptyCounter,
      limits,
    })).toEqual({ allowed: false, reason: 'daily_count' });
  });

  it('includes reservations in the hard daily cost limit', () => {
    expect(decideAiGenerationReservation({
      day: { ...emptyCounter, reservedMicroUsd: 400_000 },
      month: emptyCounter,
      limits,
    })).toEqual({ allowed: false, reason: 'daily_cost' });
  });

  it('includes completed spend in the hard monthly cost limit', () => {
    expect(decideAiGenerationReservation({
      day: emptyCounter,
      month: { ...emptyCounter, spentMicroUsd: 4_900_000 },
      limits,
    })).toEqual({ allowed: false, reason: 'monthly_cost' });
  });
});
