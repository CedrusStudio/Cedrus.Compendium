import { beforeEach, describe, expect, it, vi } from 'vitest';
import { POWER_SCALES } from '@/domain/ai-character-generation/powerTiers';

const { responsesCreate, proposalParse } = vi.hoisted(() => ({
  responsesCreate: vi.fn(),
  proposalParse: vi.fn(value => value),
}));

vi.mock('openai', () => ({
  default: class OpenAI {
    responses = { create: responsesCreate };
  },
}));

vi.mock('@/infrastructure/ai-character-generation/openAiCharacterProposalResponseFormat', () => ({
  openAiCharacterProposalResponseFormat: { type: 'json_schema' },
  // The provider undoes the wire format's nulls before parsing; a mock that
  // omits it fails as an unrelated "draft does not match the format" error.
  stripWireNulls: (value: unknown) => value,
}));

vi.mock('@/domain/ai-character-generation/aiCharacterProposalSchema', () => ({
  aiCharacterProposalSchema: { parse: proposalParse },
}));

import {
  OpenAiCharacterGenerationProvider,
  OpenAiCharacterGenerationProviderError,
} from '@/infrastructure/ai-character-generation/OpenAiCharacterGenerationProvider';
import { MAX_CHARACTER_GENERATION_CONTEXT_CHARS } from '@/domain/ai-character-generation/buildCharacterGenerationContext';

const context = {
  request: {
    description: 'Zwiadowca walczący łukiem i magią lodu.',
    referenceCharacterIds: [],
    constraints: { language: 'pl-PL' as const, allowCustomEquipment: false, allowCustomAbilities: false },
  },
  references: [],
  allowedCatalog: { availability: 'not-configured' as const, entries: [] },
  rulebookContext: { availability: 'not-configured' as const, fragments: [] },
  balanceProfiles: [],
  // The warrior ladder is the default family; the tests do not exercise it.
  powerScale: POWER_SCALES[0],
};

describe('OpenAiCharacterGenerationProvider', () => {
  beforeEach(() => {
    responsesCreate.mockReset();
    proposalParse.mockReset();
    proposalParse.mockImplementation(value => value);
  });

  it('uses the Responses API with strict structured output and conservatively calculates cost', async () => {
    responsesCreate.mockResolvedValue({
      id: 'resp_123',
      output_text: JSON.stringify({ header: { name: 'Draft' } }),
      usage: { input_tokens: 100, output_tokens: 50 },
    });

    const provider = new OpenAiCharacterGenerationProvider({
      apiKey: 'test-key',
      model: 'gpt-5.6-luna',
      maxOutputTokens: 6_000,
      reasoningEffort: 'medium' as const,
      inputTokenMicroUsd: 1,
      outputTokenMicroUsd: 6,
    });

    await expect(provider.generate(context)).resolves.toEqual(expect.objectContaining({
      providerRequestId: 'resp_123',
      costMicroUsd: 400,
      usage: expect.objectContaining({ inputTokens: 100, outputTokens: 50 }),
    }));
    expect(responsesCreate).toHaveBeenCalledWith(expect.objectContaining({
      model: 'gpt-5.6-luna',
      store: false,
      max_output_tokens: 6_000,
      reasoning: { effort: 'medium' },
      text: { format: { type: 'json_schema' } },
    }));
  });

  it('does not send an oversized context to OpenAI', async () => {
    const provider = new OpenAiCharacterGenerationProvider({
      apiKey: 'test-key',
      model: 'gpt-5.6-luna',
      maxOutputTokens: 6_000,
      reasoningEffort: 'medium' as const,
      inputTokenMicroUsd: 1,
      outputTokenMicroUsd: 6,
    });

    // Derived from the shared ceiling rather than repeated as a literal: the
    // limit has moved once already, and a hardcoded copy silently stopped
    // testing anything when it did.
    await expect(provider.generate({
      ...context,
      references: [{ description: 'x'.repeat(MAX_CHARACTER_GENERATION_CONTEXT_CHARS + 1) }] as never,
    })).rejects.toBeInstanceOf(OpenAiCharacterGenerationProviderError);

    expect(responsesCreate).not.toHaveBeenCalled();
  });

  it('maps a provider auth rejection to a safe diagnostic without exposing request data', async () => {
    responsesCreate.mockRejectedValue({ status: 401, message: 'secret provider detail' });

    const provider = new OpenAiCharacterGenerationProvider({
      apiKey: 'test-key',
      model: 'gpt-5.6-luna',
      maxOutputTokens: 6_000,
      reasoningEffort: 'medium' as const,
      inputTokenMicroUsd: 1,
      outputTokenMicroUsd: 6,
    });

    await expect(provider.generate(context)).rejects.toMatchObject({
      reason: 'authentication',
      message: 'OpenAI rejected the server API key.',
    });
  });
});
