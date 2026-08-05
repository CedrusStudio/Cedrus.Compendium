import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { POWER_SCALES } from '@/domain/ai-character-generation/powerTiers';

const { proposalParse } = vi.hoisted(() => ({ proposalParse: vi.fn(value => value) }));

vi.mock('@/domain/ai-character-generation/aiCharacterProposalSchema', () => ({
  aiCharacterProposalSchema: { parse: proposalParse },
}));

vi.mock('@/infrastructure/ai-character-generation/openAiCharacterProposalResponseFormat', () => ({
  aiCharacterProposalStrictJsonSchema: { type: 'object', additionalProperties: false },
  stripWireNulls: (value: unknown) => value,
}));

import { OllamaCharacterGenerationProvider } from '@/infrastructure/ai-character-generation/OllamaCharacterGenerationProvider';

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

describe('OllamaCharacterGenerationProvider', () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    proposalParse.mockReset();
    proposalParse.mockImplementation(value => value);
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => vi.unstubAllGlobals());

  it('uses the local structured-output endpoint and reports zero monetary cost', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        response: JSON.stringify({ header: { name: 'Draft' } }),
        prompt_eval_count: 120,
        eval_count: 80,
      }),
    });

    const provider = new OllamaCharacterGenerationProvider({
      baseUrl: 'http://127.0.0.1:11434',
      model: 'qwen3:8b',
    });

    await expect(provider.generate(context)).resolves.toEqual(expect.objectContaining({
      costMicroUsd: 0,
      usage: { inputTokens: 120, outputTokens: 80 },
    }));
    expect(fetchMock).toHaveBeenCalledWith('http://127.0.0.1:11434/api/generate', expect.objectContaining({
      method: 'POST',
      body: expect.stringContaining('"stream":false'),
    }));
  });
});
