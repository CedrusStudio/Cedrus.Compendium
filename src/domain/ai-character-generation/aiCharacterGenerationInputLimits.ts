import type { AiCharacterGenerationRequest } from '@/domain/ai-character-generation/aiCharacterGenerationSchemas';

export type AiCharacterGenerationInputLimits = {
  maxReferences: number;
  maxDescriptionChars: number;
};

/**
 * Static schema bounds protect the public contract; these runtime bounds let a
 * deployment tighten it further without rebuilding the frontend.
 */
export function validateAiCharacterGenerationInputLimits(
  request: AiCharacterGenerationRequest,
  limits: AiCharacterGenerationInputLimits,
): string[]
{
  const errors: string[] = [];

  if (request.referenceCharacterIds.length > limits.maxReferences) {
    errors.push('Too many AI character references.');
  }

  if (request.description.length > limits.maxDescriptionChars) {
    errors.push('AI character description is too long.');
  }

  return errors;
}
