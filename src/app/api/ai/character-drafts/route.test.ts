import { beforeEach, describe, expect, it, vi } from 'vitest';

const { adminApiKeys, aiCharacterGenerationSettings, generateAiCharacterDraft } = vi.hoisted(() => ({
  adminApiKeys: ['alpha'] as string[],
  generateAiCharacterDraft: vi.fn(),
  aiCharacterGenerationSettings: {
    enabled: false,
    maxReferences: 3,
    maxDescriptionChars: 4_000,
  },
}));

vi.mock('@/lib/env', () => ({
  adminApiKeys,
  aiCharacterGenerationSettings,
}));

vi.mock('@/application/ai-character-generation/generateAiCharacterDraft', () => ({
  generateAiCharacterDraft,
  AiCharacterGenerationCostLimitError: class AiCharacterGenerationCostLimitError extends Error {},
}));

import { AiCharacterGenerationCostLimitError } from '@/application/ai-character-generation/generateAiCharacterDraft';
import { AiCharacterReferenceUnavailableError } from '@/infrastructure/ai-character-generation/MongoCharacterGenerationContextSource';
import { AiGenerationBudgetExceededError } from '@/persistence/ai-character-generation/aiCharacterGenerationErrors';
import { POST } from '@/app/api/ai/character-drafts/route';
import { API_KEY_HEADER } from '@/proxy';

const validPayload = {
  description: 'Zwiadowca walczący łukiem i magią lodu.',
};

describe('AI character drafts route', () => {
  beforeEach(() => {
    adminApiKeys.splice(0, adminApiKeys.length, 'alpha');
    aiCharacterGenerationSettings.enabled = false;
    aiCharacterGenerationSettings.maxReferences = 3;
    aiCharacterGenerationSettings.maxDescriptionChars = 4_000;
    generateAiCharacterDraft.mockReset();
    generateAiCharacterDraft.mockResolvedValue({ id: 'draft-1' });
  });

  it('rejects a request without an API key before checking provider settings', async () => {
    const response = await POST(new Request('http://localhost/api/ai/character-drafts', {
      method: 'POST',
      body: JSON.stringify(validPayload),
    }));

    expect(response.status).toBe(401);
  });

  it('does not parse or send a request while the feature flag is disabled', async () => {
    const response = await POST(new Request('http://localhost/api/ai/character-drafts', {
      method: 'POST',
      headers: { [API_KEY_HEADER]: 'alpha' },
      body: JSON.stringify(validPayload),
    }));

    expect(response.status).toBe(503);
  });

  it('validates the BFF payload before the future provider call', async () => {
    aiCharacterGenerationSettings.enabled = true;

    const response = await POST(new Request('http://localhost/api/ai/character-drafts', {
      method: 'POST',
      headers: { [API_KEY_HEADER]: 'alpha' },
      body: JSON.stringify({ description: 'za krótki' }),
    }));

    expect(response.status).toBe(400);
  });

  it('creates a draft through the server-side generation service', async () => {
    aiCharacterGenerationSettings.enabled = true;

    const response = await POST(new Request('http://localhost/api/ai/character-drafts', {
      method: 'POST',
      headers: { [API_KEY_HEADER]: 'alpha' },
      body: JSON.stringify(validPayload),
    }));

    expect(response.status).toBe(201);
    expect(generateAiCharacterDraft).toHaveBeenCalledWith({
      apiKey: 'alpha',
      request: expect.objectContaining(validPayload),
    });
  });

  it('honours tighter deployment limits before a provider can be called', async () => {
    aiCharacterGenerationSettings.enabled = true;
    aiCharacterGenerationSettings.maxReferences = 1;

    const response = await POST(new Request('http://localhost/api/ai/character-drafts', {
      method: 'POST',
      headers: { [API_KEY_HEADER]: 'alpha' },
      body: JSON.stringify({
        ...validPayload,
        referenceCharacterIds: ['first', 'second'],
      }),
    }));

    expect(response.status).toBe(400);
  });
});

describe('generation failure responses', () => {
  const request = (body = JSON.stringify(validPayload)) => new Request('http://localhost/api/ai/character-drafts', {
    method: 'POST', headers: { [API_KEY_HEADER]: 'alpha' }, body,
  });
  beforeEach(() => {
    aiCharacterGenerationSettings.enabled = true;
    generateAiCharacterDraft.mockReset();
  });

  it('rejects malformed JSON without calling the generation service', async () => {
    const response = await POST(request('{'));
    expect(response.status).toBe(400);
    expect(generateAiCharacterDraft).not.toHaveBeenCalled();
  });

  it.each([
    { failure: new AiCharacterReferenceUnavailableError(), status: 400, message: 'At least one selected reference is unavailable.' },
    { failure: new AiGenerationBudgetExceededError('daily_count'), status: 429, message: 'AI_MAX_GENERATIONS_PER_DAY' },
    { failure: new AiGenerationBudgetExceededError('daily_cost'), status: 429, message: 'AI_DAILY_LIMIT_MICRO_USD' },
    { failure: new AiGenerationBudgetExceededError('monthly_cost'), status: 429, message: 'AI_MONTHLY_LIMIT_MICRO_USD' },
    { failure: new AiCharacterGenerationCostLimitError(), status: 429, message: 'AI_MAX_REQUEST_COST_MICRO_USD' },
    { failure: { name: 'OpenAiCharacterGenerationProviderError', reason: 'rate_limit', message: 'Limit dostawcy.' }, status: 503, message: 'Limit dostawcy.' },
    { failure: { name: 'OpenAiCharacterGenerationProviderError', reason: 'response', message: 'Brak odpowiedzi.' }, status: 502, message: 'Brak odpowiedzi.' },
    { failure: { name: 'LocalFileCharacterGenerationProviderError', message: 'Zapisz szkic.' }, status: 409, message: 'Zapisz szkic.' },
  ])('returns a specific status and message for $message', async ({ failure, status, message }) => {
    generateAiCharacterDraft.mockRejectedValue(failure);
    const response = await POST(request());
    expect(response.status).toBe(status);
    expect((await response.json()).error).toContain(message);
  });

  it.each([
    null, 'mock internal detail', new Error('mock internal detail'),
    { name: 'OpenAiCharacterGenerationProviderError', message: 42 },
    { name: 'OpenAiCharacterGenerationProviderError', message: 'mock internal detail' },
    { name: 'LocalFileCharacterGenerationProviderError', message: 42 },
  ])('returns a generic error for an unexpected service failure (%j)', async failure => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => {});
    try {
      generateAiCharacterDraft.mockRejectedValue(failure);
      const response = await POST(request());
      expect(response.status).toBe(502);
      expect(await response.json()).toEqual({ error: 'AI character generation failed.' });
    } finally {
      log.mockRestore();
    }
  });
});
