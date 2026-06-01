import { beforeEach, describe, expect, it, vi } from 'vitest';

const { adminApiKeys, findUnique, upsert } = vi.hoisted(() => ({
  adminApiKeys: ['alpha'] as string[],
  findUnique: vi.fn(),
  upsert: vi.fn(),
}));

vi.mock('@/lib/env', () => ({
  adminApiKeys,
}));

vi.mock('@/lib/prisma', () => ({
  default: {
    personalizationProfileRecord: {
      findUnique,
      upsert,
    },
  },
}));

import { GET, PUT } from '@/app/api/personalization/route';
import { hashApiKey } from '@/lib/apiKeyHash';
import { createEmptyProfile } from '@/persistence/slices/personalizationSlice';
import { API_KEY_HEADER } from '@/proxy';

describe('personalization route', () => {
  beforeEach(() => {
    adminApiKeys.splice(0, adminApiKeys.length, 'alpha');
    findUnique.mockReset();
    upsert.mockReset();
  });

  it('rejects unauthenticated and invalid requests', async () => {
    const missingResponse = await GET(new Request('http://localhost/api/personalization'));
    const invalidResponse = await GET(new Request('http://localhost/api/personalization', {
      headers: {
        [API_KEY_HEADER]: 'gamma',
      },
    }));

    expect(missingResponse.status).toBe(401);
    expect(invalidResponse.status).toBe(403);
  });

  it('returns the stored profile for a valid API key hash', async () => {
    const storedProfile = {
      ...createEmptyProfile(),
      userName: 'Marek',
      favoriteCharacterIds: ['character-1'],
      mainCharacterId: 'character-1',
    };

    findUnique.mockResolvedValue({
      id: 'profile-1',
      apiKeyHash: hashApiKey('alpha'),
      profile: JSON.stringify(storedProfile),
    });

    const response = await GET(new Request('http://localhost/api/personalization', {
      headers: {
        [API_KEY_HEADER]: 'alpha',
      },
    }));

    expect(findUnique).toHaveBeenCalledWith({
      where: {
        apiKeyHash: hashApiKey('alpha'),
      },
    });
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual(storedProfile);
  });

  it('sanitizes and upserts the profile payload', async () => {
    upsert.mockResolvedValue({ id: 'profile-1' });

    const response = await PUT(new Request('http://localhost/api/personalization', {
      method: 'PUT',
      headers: {
        'content-type': 'application/json',
        [API_KEY_HEADER]: 'alpha',
      },
      body: JSON.stringify({
        userName: '  Anna  ',
        favoriteCharacterIds: ['character-1'],
        mainCharacterId: 'character-404',
      }),
    }));

    expect(upsert).toHaveBeenCalledWith({
      where: {
        apiKeyHash: hashApiKey('alpha'),
      },
      update: {
        profile: JSON.stringify({
          ...createEmptyProfile(),
          userName: 'Anna',
          favoriteCharacterIds: ['character-1'],
          mainCharacterId: undefined,
        }),
      },
      create: {
        apiKeyHash: hashApiKey('alpha'),
        profile: JSON.stringify({
          ...createEmptyProfile(),
          userName: 'Anna',
          favoriteCharacterIds: ['character-1'],
          mainCharacterId: undefined,
        }),
      },
    });
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      ...createEmptyProfile(),
      userName: 'Anna',
      favoriteCharacterIds: ['character-1'],
      mainCharacterId: undefined,
    });
  });
});