import 'server-only';
import OpenAI from 'openai';
import type {
  CharacterGenerationContext,
  CharacterGenerationProvider,
  CharacterGenerationProviderResult,
  CharacterGenerationRepairRequest,
} from '@/domain/ai-character-generation/CharacterGenerationProvider';
import { aiCharacterProposalSchema } from '@/domain/ai-character-generation/aiCharacterProposalSchema';
import { MAX_CHARACTER_GENERATION_CONTEXT_CHARS } from '@/domain/ai-character-generation/buildCharacterGenerationContext';
import {
  buildCatalogIdentityIndex,
  normalizeAiProposalIdentifiers,
} from '@/domain/ai-character-generation/normalizeAiProposalIdentifiers';
import type { OpenAiCharacterGenerationServerSettings } from '@/lib/aiCharacterGenerationServerSettings';
import { characterGenerationInstructions } from '@/domain/ai-character-generation/characterGenerationInstructions';
import { stripWireNulls, openAiCharacterProposalResponseFormat } from './openAiCharacterProposalResponseFormat';

export class OpenAiCharacterGenerationProviderError extends Error
{
  readonly reason: 'authentication' | 'model' | 'rate_limit' | 'request' | 'response' | 'network' | 'unknown';

  constructor(
    message = 'OpenAI character generation failed.',
    reason: OpenAiCharacterGenerationProviderError['reason'] = 'unknown',
  )
  {
    super(message);
    this.name = 'OpenAiCharacterGenerationProviderError';
    this.reason = reason;
  }
}

const instructions = characterGenerationInstructions;

/**
 * Zod rejections are the one provider failure the operator can act on: they
 * mean the wire schema and the DTO contract have drifted apart. Logging the
 * paths keeps that diagnosable without ever echoing the draft itself, which
 * may contain user content.
 */
function logProposalRejection(error: unknown): void
{
  const issues = typeof error === 'object' && error !== null && 'issues' in error
    ? (error as { issues?: unknown }).issues
    : undefined;

  if (Array.isArray(issues)) {
    console.error('OpenAI character proposal failed validation:', issues.map((issue: unknown) => {
      const { path, code, message } = (issue ?? {}) as { path?: unknown; code?: unknown; message?: unknown };
      return `${Array.isArray(path) ? path.join('.') : '<root>'}: ${String(code)} — ${String(message)}`;
    }));
    return;
  }

  console.error('OpenAI character proposal could not be read:', error);
}

function toSafeProviderError(error: unknown): OpenAiCharacterGenerationProviderError
{
  const status = typeof error === 'object' && error !== null && 'status' in error
    ? (error as { status?: unknown }).status
    : undefined;

  if (status === 401 || status === 403) {
    return new OpenAiCharacterGenerationProviderError('OpenAI rejected the server API key.', 'authentication');
  }
  if (status === 404) {
    return new OpenAiCharacterGenerationProviderError('Configured OpenAI model is unavailable for this API project.', 'model');
  }
  if (status === 429) {
    return new OpenAiCharacterGenerationProviderError('OpenAI rate or spending limit has been reached.', 'rate_limit');
  }
  if (status === 400) {
    return new OpenAiCharacterGenerationProviderError('OpenAI rejected the generation request configuration.', 'request');
  }

  const code = typeof error === 'object' && error !== null && 'code' in error
    ? (error as { code?: unknown }).code
    : undefined;
  if (typeof code === 'string' && ['ECONNREFUSED', 'ECONNRESET', 'ENOTFOUND', 'ETIMEDOUT'].includes(code)) {
    return new OpenAiCharacterGenerationProviderError('The server could not connect to OpenAI.', 'network');
  }

  return new OpenAiCharacterGenerationProviderError();
}

/**
 * Server-only OpenAI adapter. It has no access to the request, Prisma, backups
 * or API-key scope. Structured Outputs and a second Zod parse keep provider
 * data separate from the application's persistence contract.
 */
export class OpenAiCharacterGenerationProvider implements CharacterGenerationProvider
{
  readonly name = 'openai';
  readonly model: string;

  private readonly client: OpenAI;
  private readonly maxOutputTokens: number;
  private readonly reasoningEffort: 'low' | 'medium' | 'high';
  private readonly inputTokenMicroUsd: number;
  private readonly outputTokenMicroUsd: number;

  constructor(settings: OpenAiCharacterGenerationServerSettings & { model: string })
  {
    this.model = settings.model;
    this.client = new OpenAI({
      apiKey: settings.apiKey,
      maxRetries: 0,
      timeout: 60_000,
    });
    this.maxOutputTokens = settings.maxOutputTokens;
    this.reasoningEffort = settings.reasoningEffort;
    this.inputTokenMicroUsd = settings.inputTokenMicroUsd;
    this.outputTokenMicroUsd = settings.outputTokenMicroUsd;
  }

  async generate(context: CharacterGenerationContext): Promise<CharacterGenerationProviderResult>
  {
    return this.ask(context, []);
  }

  /**
   * Second pass over a draft the server has already reviewed.
   *
   * It sends the whole proposal back rather than a diff, because the model has
   * to be able to move a rank, drop a dependent entry and raise the statistic
   * that supports it in one coherent answer — a patch-shaped reply invites
   * fixing one note and breaking another.
   *
   * The original instructions travel unchanged underneath, so nothing about the
   * repair loosens a rule the first pass was held to.
   */
  async repair(
    context: CharacterGenerationContext,
    attempt: CharacterGenerationRepairRequest,
  ): Promise<CharacterGenerationProviderResult>
  {
    return this.ask(context, [
      {
        role: 'system' as const,
        content: 'The draft below is your previous answer to this same request. The application checked it '
          + 'against the compendium and found the faults listed after it. Return a corrected draft that keeps '
          + 'everything the description asks for and leaves none of those faults standing. A fault about an '
          + 'unmet requirement is fixed either by taking the entry it demands at the rank it demands, or by '
          + 'dropping the entry that demanded it — never by leaving it as it is. Change nothing else.',
      },
      { role: 'user' as const, content: JSON.stringify({ previousDraft: attempt.proposal, faults: attempt.issues }) },
    ]);
  }

  private async ask(
    context: CharacterGenerationContext,
    extraInput: { role: 'system' | 'user'; content: string }[],
  ): Promise<CharacterGenerationProviderResult>
  {
    const contextJson = JSON.stringify(context);
    if (contextJson.length > MAX_CHARACTER_GENERATION_CONTEXT_CHARS) {
      throw new OpenAiCharacterGenerationProviderError('AI character generation context is too large.');
    }

    try {
      const response = await this.client.responses.create({
        model: this.model,
        store: false,
        max_output_tokens: this.maxOutputTokens,
        reasoning: { effort: this.reasoningEffort },
        input: [
          { role: 'system', content: instructions },
          { role: 'user', content: contextJson },
          ...extraInput,
        ],
        text: {
          format: openAiCharacterProposalResponseFormat,
        },
      });

      // A truncated response is still syntactically a response, and its
      // partial JSON would otherwise surface as an unexplained format error.
      if (response.status === 'incomplete' && response.incomplete_details?.reason === 'max_output_tokens') {
        throw new OpenAiCharacterGenerationProviderError(
          'OpenAI ran out of output tokens before finishing the character draft.',
          'response',
        );
      }

      if (!response.output_text) {
        throw new OpenAiCharacterGenerationProviderError('OpenAI did not return a usable character proposal.', 'response');
      }

      let proposal;
      try {
        proposal = aiCharacterProposalSchema.parse(
          normalizeAiProposalIdentifiers(stripWireNulls(JSON.parse(response.output_text)), {
            allowCustomEquipment: context.request.constraints.allowCustomEquipment,
            allowCustomAbilities: context.request.constraints.allowCustomAbilities,
            catalog: buildCatalogIdentityIndex(context.allowedCatalog.entries),
          }),
        );
      } catch (error) {
        logProposalRejection(error);
        throw new OpenAiCharacterGenerationProviderError('OpenAI returned a draft that does not match the character format.', 'response');
      }
      const inputTokens = response.usage?.input_tokens;
      const outputTokens = response.usage?.output_tokens;

      if (typeof inputTokens !== 'number' || typeof outputTokens !== 'number'
        || !Number.isInteger(inputTokens) || !Number.isInteger(outputTokens)
        || inputTokens < 0 || outputTokens < 0)
      {
        throw new OpenAiCharacterGenerationProviderError('OpenAI did not return valid generation usage.');
      }

      return {
        proposal,
        usage: {
          inputTokens,
          outputTokens,
          providerRequestId: response.id,
        },
        providerRequestId: response.id,
        // The prompt is below the long-context pricing threshold and uses no
        // billed tools. Cached tokens are conservatively charged at full input
        // price, never under-counted.
        costMicroUsd: inputTokens * this.inputTokenMicroUsd
          + outputTokens * this.outputTokenMicroUsd,
      };
    } catch (error) {
      if (error instanceof OpenAiCharacterGenerationProviderError) throw error;
      throw toSafeProviderError(error);
    }
  }
}
