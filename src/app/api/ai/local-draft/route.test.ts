import { beforeEach, describe, expect, it, vi } from 'vitest';

const { adminApiKeys, aiCharacterGenerationSettings, discardPreparedDraft } = vi.hoisted(() => ({
  adminApiKeys: ['alpha'] as string[],
  aiCharacterGenerationSettings: { provider: 'local' as string, localModelLabel: 'local-file' },
  discardPreparedDraft: vi.fn(),
}));

vi.mock('@/lib/env', () => ({ adminApiKeys, aiCharacterGenerationSettings }));

vi.mock('@/lib/aiCharacterGenerationServerSettings', () => ({
  getLocalCharacterGenerationServerSettings: () => ({ workspaceDirectory: '/tmp/ai-workspace' }),
}));

vi.mock('@/infrastructure/ai-character-generation/LocalFileCharacterGenerationProvider', () => ({
  LocalFileCharacterGenerationProvider: class {
    discardPreparedDraft = discardPreparedDraft;
  },
}));

import { DELETE } from '@/app/api/ai/local-draft/route';
import { API_KEY_HEADER } from '@/proxy';

const request = (withKey = true) => new Request('http://localhost/api/ai/local-draft', {
  method: 'DELETE',
  ...(withKey ? { headers: { [API_KEY_HEADER]: 'alpha' } } : {}),
});

describe('prepared local draft route', () => {
  beforeEach(() => {
    adminApiKeys.splice(0, adminApiKeys.length, 'alpha');
    aiCharacterGenerationSettings.provider = 'local';
    discardPreparedDraft.mockReset();
    discardPreparedDraft.mockReturnValue(true);
  });

  it('refuses a request without an API key before touching the workspace', async () => {
    const response = await DELETE(request(false));

    expect(response.status).toBe(401);
    expect(discardPreparedDraft).not.toHaveBeenCalled();
  });

  it('refuses when the server is not running the offline provider', async () => {
    // There is no prepared file to speak of when OpenAI is answering.
    aiCharacterGenerationSettings.provider = 'openai';

    const response = await DELETE(request());

    expect(response.status).toBe(409);
    expect(discardPreparedDraft).not.toHaveBeenCalled();
  });

  it('reports that the draft was thrown away', async () => {
    const response = await DELETE(request());

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ removed: true });
  });

  it('tells the difference between clearing one and finding none', async () => {
    discardPreparedDraft.mockReturnValue(false);

    await expect((await DELETE(request())).json()).resolves.toEqual({ removed: false });
  });

  it('does not leak a filesystem failure to the caller', async () => {
    discardPreparedDraft.mockImplementation(() => { throw new Error('EACCES /srv/secret/path'); });

    const response = await DELETE(request());

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({ error: 'Nie udało się usunąć przygotowanej wersji roboczej.' });
  });
});
