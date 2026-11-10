import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createPendingDraft } from '@/__tests__/fixtures/aiCharacterDraft';

import { aiCharacterProposalSchema } from '@/domain/ai-character-generation/aiCharacterProposalSchema';

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

beforeEach(() => {
  vi.spyOn(aiCharacterProposalSchema, 'parse').mockImplementation(value => proposalParse(value) as ReturnType<typeof aiCharacterProposalSchema.parse>);
});

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

describe('provider response handling', () => {
  const provider = () => new OpenAiCharacterGenerationProvider({
    apiKey: 'test-key', model: 'test-model', maxOutputTokens: 6000, reasoningEffort: 'low',
    inputTokenMicroUsd: 1, outputTokenMicroUsd: 6,
  });

  beforeEach(() => {
    responsesCreate.mockReset();
    proposalParse.mockReset().mockImplementation(value => value);
  });

  it.each([
    [{ status: 403 }, 'authentication'],
    [{ status: 404 }, 'model'],
    [{ status: 429 }, 'rate_limit'],
    [{ status: 400 }, 'request'],
    [{ code: 'ETIMEDOUT' }, 'network'],
    [{ code: 'UNRECOGNIZED' }, 'unknown'],
    ['test-only private exception', 'unknown'],
  ] as const)('maps a rejected request to a safe %j diagnostic', async (failure, reason) => {
    responsesCreate.mockRejectedValue(failure);
    await expect(provider().generate(context)).rejects.toMatchObject({ reason });
    expect(proposalParse).not.toHaveBeenCalled();
  });

  it.each([
    { name: 'truncated', payload: { status: 'incomplete', incomplete_details: { reason: 'max_output_tokens' }, output_text: '{' }, message: /ran out of output tokens/ },
    { name: 'no output', payload: { status: 'completed', output_text: '' }, message: /usable character proposal/ },
  ])('reports $name before parsing', async ({ payload, message }) => {
    responsesCreate.mockResolvedValue(payload);
    await expect(provider().generate(context)).rejects.toMatchObject({ reason: 'response', message: expect.stringMatching(message) });
    expect(proposalParse).not.toHaveBeenCalled();
  });

  it.each([
    undefined, { input_tokens: 2 }, { input_tokens: 2.5, output_tokens: 1 },
    { input_tokens: 1, output_tokens: 2.5 }, { input_tokens: -1, output_tokens: 2 }, { input_tokens: 2, output_tokens: -1 },
  ])('rejects missing or invalid usage (%j)', async usage => {
    responsesCreate.mockResolvedValue({ id: 'resp', output_text: '{}', usage });
    await expect(provider().generate(context)).rejects.toThrow('OpenAI did not return valid generation usage.');
  });

  it('returns a format error for malformed JSON and invalid proposals', async () => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => {});
    try {
      responsesCreate.mockResolvedValueOnce({ id: 'resp', output_text: '{' })
        .mockResolvedValueOnce({ id: 'resp', output_text: '{}' });
      proposalParse.mockImplementationOnce(() => {
        throw { issues: [{ path: ['header', 'name'], code: 'invalid_type', message: 'Required' }] };
      });

      await expect(provider().generate(context)).rejects.toMatchObject({ reason: 'response', message: expect.stringContaining('does not match') });
      await expect(provider().generate(context)).rejects.toMatchObject({ reason: 'response', message: expect.stringContaining('does not match') });
      expect(log).toHaveBeenCalledWith('OpenAI character proposal failed validation:', ['header.name: invalid_type — Required']);
    } finally {
      log.mockRestore();
    }
  });

  it('sends the reviewed proposal and faults with the original generation context', async () => {
    const proposal = createPendingDraft().proposal!;
    const issues = ['Wymagana postawa ma za niską rangę.'];
    responsesCreate.mockResolvedValue({
      id: 'resp_repair', output_text: JSON.stringify(proposal), usage: { input_tokens: 5, output_tokens: 2 },
    });
    await expect(provider().repair(context, { proposal, issues })).resolves.toMatchObject({
      costMicroUsd: 17, providerRequestId: 'resp_repair',
    });
    const [request] = responsesCreate.mock.calls[0];
    expect(request.input[1]).toEqual({ role: 'user', content: JSON.stringify(context) });
    expect(request.input.at(-1)).toEqual({ role: 'user', content: JSON.stringify({ previousDraft: proposal, faults: issues }) });
  });
});
