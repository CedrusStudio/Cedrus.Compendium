import { beforeEach, describe, expect, it, vi } from 'vitest';

const { adminApiKeys, acceptAiCharacterDraft } = vi.hoisted(() => ({
  adminApiKeys: ['alpha'] as string[],
  acceptAiCharacterDraft: vi.fn(),
}));

vi.mock('@/lib/env', () => ({ adminApiKeys }));
vi.mock('@/application/ai-character-generation/acceptAiCharacterDraft', () => ({ acceptAiCharacterDraft }));

import { POST } from '@/app/api/ai/character-drafts/[id]/accept/route';
import { API_KEY_HEADER } from '@/proxy';
import { AiCharacterDraftAcceptanceConflictError } from '@/persistence/ai-character-generation/aiCharacterDraftAcceptanceErrors';
import { AiCharacterDraftStateError } from '@/persistence/ai-character-generation/aiCharacterDraftErrors';

const params = (id: string) => ({ params: Promise.resolve({ id }) });

describe('AI character draft acceptance route', () => {
  beforeEach(() => {
    adminApiKeys.splice(0, adminApiKeys.length, 'alpha');
    acceptAiCharacterDraft.mockReset();
    acceptAiCharacterDraft.mockResolvedValue('character-1');
  });

  it('requires an API key before trying to accept a draft', async () => {
    const response = await POST(new Request('http://localhost/api/ai/character-drafts/draft-1/accept', { method: 'POST' }), params('draft-1'));

    expect(response.status).toBe(401);
    expect(acceptAiCharacterDraft).not.toHaveBeenCalled();
  });

  it('returns the character ID from the transactional acceptance service', async () => {
    const response = await POST(new Request('http://localhost/api/ai/character-drafts/draft-1/accept', {
      method: 'POST',
      headers: { [API_KEY_HEADER]: 'alpha' },
    }), params('draft-1'));

    expect(acceptAiCharacterDraft).toHaveBeenCalledWith({ draftId: 'draft-1', apiKey: 'alpha' });
    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toEqual({ characterId: 'character-1' });
  });

  it('returns validation conflicts without creating a character', async () => {
    acceptAiCharacterDraft.mockRejectedValue(new AiCharacterDraftAcceptanceConflictError(['Nazwa lub krótka nazwa postaci jest już zajęta.']));

    const response = await POST(new Request('http://localhost/api/ai/character-drafts/draft-1/accept', {
      method: 'POST',
      headers: { [API_KEY_HEADER]: 'alpha' },
    }), params('draft-1'));

    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toEqual(expect.objectContaining({
      issues: ['Nazwa lub krótka nazwa postaci jest już zajęta.'],
    }));
  });

  it('returns 409 when a draft was already processed', async () => {
    acceptAiCharacterDraft.mockRejectedValue(new AiCharacterDraftStateError('Only a pending AI character draft can be accepted.'));

    const response = await POST(new Request('http://localhost/api/ai/character-drafts/draft-1/accept', {
      method: 'POST',
      headers: { [API_KEY_HEADER]: 'alpha' },
    }), params('draft-1'));

    expect(response.status).toBe(409);
  });
});
