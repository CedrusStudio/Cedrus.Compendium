import type { AiGenerationBudgetDecision } from '@/domain/ai-character-generation/aiGenerationBudget';

export class AiGenerationBudgetExceededError extends Error {
  readonly reason: Exclude<AiGenerationBudgetDecision, { allowed: true }>['reason'];

  constructor(reason: Exclude<AiGenerationBudgetDecision, { allowed: true }>['reason']) {
    super('AI character generation budget has been exhausted: ' + reason + '.');
    this.name = 'AiGenerationBudgetExceededError';
    this.reason = reason;
  }
}

export class AiGenerationReservationNotFoundError extends Error {
  constructor() {
    super('AI generation reservation was not found.');
    this.name = 'AiGenerationReservationNotFoundError';
  }
}

export class AiGenerationReservationStateError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AiGenerationReservationStateError';
  }
}
