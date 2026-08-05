import { NextResponse } from 'next/server';
import { getValidatedApiKey } from '@/lib/apiKeyValidation';
import { aiCharacterGenerationSettings } from '@/lib/env';
import { aiCharacterGenerationRequestSchema } from '@/domain/ai-character-generation/aiCharacterGenerationSchemas';
import { validateAiCharacterGenerationInputLimits } from '@/domain/ai-character-generation/aiCharacterGenerationInputLimits';
import { generateAiCharacterDraft, AiCharacterGenerationCostLimitError } from '@/application/ai-character-generation/generateAiCharacterDraft';
import { AiCharacterReferenceUnavailableError } from '@/infrastructure/ai-character-generation/MongoCharacterGenerationContextSource';
import { AiGenerationBudgetExceededError } from '@/persistence/ai-character-generation/aiCharacterGenerationErrors';
import { OpenAiCharacterGenerationProviderError } from '@/infrastructure/ai-character-generation/OpenAiCharacterGenerationProvider';

/** These are the application's own ceilings, not the provider's billing. */
const budgetLimitMessages: Record<'daily_cost' | 'monthly_cost' | 'daily_count', string> = {
  daily_count: 'Wyczerpano dzienny limit liczby generacji (AI_MAX_GENERATIONS_PER_DAY). Licznik zeruje się o północy UTC.',
  daily_cost: 'Wyczerpano dzienny limit kosztu generacji (AI_DAILY_LIMIT_MICRO_USD). Licznik zeruje się o północy UTC.',
  monthly_cost: 'Wyczerpano miesięczny limit kosztu generacji (AI_MONTHLY_LIMIT_MICRO_USD).',
};

function isLocalFileCharacterGenerationProviderError(error: unknown): error is { message: string }
{
  return typeof error === 'object'
    && error !== null
    && (error as { name?: unknown }).name === 'LocalFileCharacterGenerationProviderError'
    && typeof (error as { message?: unknown }).message === 'string';
}

function isOpenAiCharacterGenerationProviderError(
  error: unknown,
): error is Pick<OpenAiCharacterGenerationProviderError, 'name' | 'message' | 'reason'>
{
  return typeof error === 'object'
    && error !== null
    && (error as { name?: unknown }).name === 'OpenAiCharacterGenerationProviderError'
    && typeof (error as { message?: unknown }).message === 'string'
    && typeof (error as { reason?: unknown }).reason === 'string';
}

/**
 * The BFF owns authentication, input limits and error shaping. The generation
 * service reserves application budget before it invokes the paid provider.
 */
export async function POST(request: Request) {
  const apiKeyOrResponse = getValidatedApiKey(request);
  if (typeof apiKeyOrResponse !== 'string') return apiKeyOrResponse;

  if (!aiCharacterGenerationSettings.enabled) {
    return NextResponse.json({ error: 'AI character generation is disabled.' }, { status: 503 });
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid AI character generation payload.' }, { status: 400 });
  }

  const parsed = aiCharacterGenerationRequestSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid AI character generation payload.' }, { status: 400 });
  }

  const limitViolations = validateAiCharacterGenerationInputLimits(parsed.data, {
    maxReferences: aiCharacterGenerationSettings.maxReferences,
    maxDescriptionChars: aiCharacterGenerationSettings.maxDescriptionChars,
  });
  if (limitViolations.length > 0) {
    return NextResponse.json({ error: 'AI character generation payload exceeds deployment limits.' }, { status: 400 });
  }

  try {
    const draft = await generateAiCharacterDraft({
      apiKey: apiKeyOrResponse,
      request: parsed.data,
    });
    return NextResponse.json(draft, { status: 201 });
  } catch (error) {
    if (error instanceof AiCharacterReferenceUnavailableError) {
      return NextResponse.json({ error: 'At least one selected reference is unavailable.' }, { status: 400 });
    }
    // Which limit stopped the request decides what the operator does next —
    // wait for the day to roll over, or raise a ceiling in the environment.
    if (error instanceof AiGenerationBudgetExceededError) {
      return NextResponse.json({ error: budgetLimitMessages[error.reason] }, { status: 429 });
    }
    if (error instanceof AiCharacterGenerationCostLimitError) {
      return NextResponse.json(
        { error: 'Koszt tej generacji przekroczył limit pojedynczego żądania (AI_MAX_REQUEST_COST_MICRO_USD).' },
        { status: 429 },
      );
    }
    if (isOpenAiCharacterGenerationProviderError(error)) {
      const status = error.reason === 'rate_limit' ? 503 : 502;
      return NextResponse.json({ error: error.message }, { status });
    }
    // The local provider fails on the operator's own workspace, not on an
    // upstream service, and its message says what to do about it — so it must
    // reach the caller instead of collapsing into a generic gateway error.
    if (isLocalFileCharacterGenerationProviderError(error)) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }

    console.error('AI character draft generation failed:', error);
    return NextResponse.json({ error: 'AI character generation failed.' }, { status: 502 });
  }
}
