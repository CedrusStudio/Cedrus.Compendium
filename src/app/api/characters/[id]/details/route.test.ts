import { beforeEach, describe, expect, it, vi } from 'vitest';

const { updateCharacterDetailsMock } = vi.hoisted(() => ({
  updateCharacterDetailsMock: vi.fn(),
}));

vi.mock('@/persistence/characters/charactersRepository', async () => {
  const actual = await vi.importActual<typeof import('@/persistence/characters/charactersRepository')>(
    '@/persistence/characters/charactersRepository',
  );

  return {
    ...actual,
    updateCharacterDetails: updateCharacterDetailsMock,
  };
});

import { PUT } from '@/app/api/characters/[id]/details/route';
import { CharacterValidationError } from '@/persistence/characters/characterErrors';

function createRequest(body: unknown)
{
  return new Request('http://localhost/api/characters/character-1/details', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

function segmentData(id: string)
{
  return { params: Promise.resolve({ id }) };
}

describe('PUT /api/characters/[id]/details', () => {
  beforeEach(() => {
    updateCharacterDetailsMock.mockReset();
  });

  it('returns 400 with the character id missing', async () => {
    const response = await PUT(createRequest({}) as never, segmentData(''));

    expect(response.status).toBe(400);
  });

  it('returns 200 on success', async () => {
    updateCharacterDetailsMock.mockResolvedValue(true);

    const response = await PUT(createRequest({ name: 'Geralt' }) as never, segmentData('character-1'));

    expect(response.status).toBe(200);
  });

  it('returns 404 when the character does not exist', async () => {
    updateCharacterDetailsMock.mockResolvedValue(false);

    const response = await PUT(createRequest({ name: 'Geralt' }) as never, segmentData('missing-character'));

    expect(response.status).toBe(404);
  });

  it('returns 400 with the real message for a known validation error (e.g. apiKey not in the admin pool)', async () => {
    updateCharacterDetailsMock.mockRejectedValue(
      new CharacterValidationError('Invalid API key(s), not part of the configured admin keys: BOGUS'),
    );

    const response = await PUT(createRequest({ apiKeys: ['BOGUS'] }) as never, segmentData('character-1'));
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.message).toBe('Invalid API key(s), not part of the configured admin keys: BOGUS');
  });

  it('returns a generic 500 for unexpected errors, without leaking internal details', async () => {
    updateCharacterDetailsMock.mockRejectedValue(new Error('connection reset by peer'));

    const response = await PUT(createRequest({ name: 'Geralt' }) as never, segmentData('character-1'));
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.message).toBe('Server error');
  });
});
