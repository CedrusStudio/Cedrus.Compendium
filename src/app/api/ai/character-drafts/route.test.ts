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
