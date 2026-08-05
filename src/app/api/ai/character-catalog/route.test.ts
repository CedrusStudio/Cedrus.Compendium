import { beforeEach, describe, expect, it, vi } from 'vitest';

const { adminApiKeys, searchAiCharacterCatalog } = vi.hoisted(() => ({
  adminApiKeys: ['alpha'] as string[],
  searchAiCharacterCatalog: vi.fn(),
}));

vi.mock('@/lib/env', () => ({ adminApiKeys }));

vi.mock('@/persistence/ai-character-generation/aiCharacterCatalogRepository', () => ({
  searchAiCharacterCatalog,
}));

import { GET } from '@/app/api/ai/character-catalog/route';
import { API_KEY_HEADER } from '@/proxy';

const request = (query: string, withKey = true) => new Request(
  `http://localhost/api/ai/character-catalog${query}`,
  withKey ? { headers: { [API_KEY_HEADER]: 'alpha' } } : undefined,
);

describe('AI character catalog route', () => {
  beforeEach(() => {
    adminApiKeys.splice(0, adminApiKeys.length, 'alpha');
    searchAiCharacterCatalog.mockReset();
    searchAiCharacterCatalog.mockResolvedValue([]);
  });

  it('refuses a request without an API key before touching the database', async () => {
    const response = await GET(request('?kind=perk&query=fortel', false));

    expect(response.status).toBe(401);
    expect(searchAiCharacterCatalog).not.toHaveBeenCalled();
  });

  it('refuses a kind the compendium does not have', async () => {
    // The whitelist is what stops the query parameter from naming an arbitrary
    // Prisma model.
    const response = await GET(request('?kind=character&query=arnold'));

    expect(response.status).toBe(400);
    expect(searchAiCharacterCatalog).not.toHaveBeenCalled();
  });

  it('passes the search through and answers with what it found', async () => {
    searchAiCharacterCatalog.mockResolvedValue([
      { kind: 'perk', id: 'fortel-4', name: 'Większy Fortel', grade: 4, entry: { id: 'fortel-4' } },
    ]);

    const response = await GET(request('?kind=perk&query=fortel'));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject([{ id: 'fortel-4', grade: 4 }]);
    expect(searchAiCharacterCatalog).toHaveBeenCalledWith('perk', 'fortel', 100);
  });

  it('treats a missing query as "show me this kind"', async () => {
    // Which is how the race picker lists all 44 of them without a search term.
    await GET(request('?kind=stance'));

    expect(searchAiCharacterCatalog).toHaveBeenCalledWith('stance', '', 100);
  });

  it('does not leak a database failure to the caller', async () => {
    searchAiCharacterCatalog.mockRejectedValue(new Error('connection refused to cluster-7'));

    const response = await GET(request('?kind=perk&query=fortel'));

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({ error: 'Nie udało się przeszukać kompendium.' });
  });
});
