export type AiGenerationBudgetLimits = {
  dailyLimitMicroUsd: number;
  monthlyLimitMicroUsd: number;
  maxGenerationsPerDay: number;
  maxRequestCostMicroUsd: number;
};

export type AiGenerationBudgetCounterSnapshot = {
  reservedMicroUsd: number;
  spentMicroUsd: number;
  generationCount: number;
};

export type AiGenerationBudgetBuckets = {
  day: string;
  month: string;
};

export type AiGenerationBudgetDecision =
  | { allowed: true }
  | { allowed: false; reason: 'daily_cost' | 'monthly_cost' | 'daily_count' };

const pad = (value: number) => String(value).padStart(2, '0');

export const getAiGenerationBudgetBuckets = (now: Date): AiGenerationBudgetBuckets => ({
  day: now.getUTCFullYear() + '-' + pad(now.getUTCMonth() + 1) + '-' + pad(now.getUTCDate()),
  month: now.getUTCFullYear() + '-' + pad(now.getUTCMonth() + 1),
});

export const getBudgetCommittedMicroUsd = (counter: AiGenerationBudgetCounterSnapshot) =>
  counter.reservedMicroUsd + counter.spentMicroUsd;

export const decideAiGenerationReservation = (input: {
  day: AiGenerationBudgetCounterSnapshot;
  month: AiGenerationBudgetCounterSnapshot;
  limits: AiGenerationBudgetLimits;
}): AiGenerationBudgetDecision => {
  const { day, month, limits } = input;

  if (day.generationCount >= limits.maxGenerationsPerDay) {
    return { allowed: false, reason: 'daily_count' };
  }

  if (getBudgetCommittedMicroUsd(day) + limits.maxRequestCostMicroUsd > limits.dailyLimitMicroUsd) {
    return { allowed: false, reason: 'daily_cost' };
  }

  if (getBudgetCommittedMicroUsd(month) + limits.maxRequestCostMicroUsd > limits.monthlyLimitMicroUsd) {
    return { allowed: false, reason: 'monthly_cost' };
  }

  return { allowed: true };
};
