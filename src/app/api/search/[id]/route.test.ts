import { beforeEach, describe, expect, it, vi } from 'vitest';

const { searchEntityByIdMock } = vi.hoisted(() => ({
  searchEntityByIdMock: vi.fn(),
}));

vi.mock('@/persistence/searchEntity', () => ({
  searchEntityById: searchEntityByIdMock,
}));

import { API_KEY_HEADER } from '@/proxy';
import { POST } from '@/app/api/search/[id]/route';

function createRequest(body: unknown, apiKey?: string)
{
  const headers = new Headers({ 'Content-Type': 'application/json' });
  if (apiKey) headers.set(API_KEY_HEADER, apiKey);

  return new Request('http://localhost/api/search/character-1', {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });
}

function segmentData(id: string)
{
  return { params: Promise.resolve({ id }) };
}

describe('POST /api/search/[id]', () => {
  beforeEach(() => {
    searchEntityByIdMock.mockReset();
    searchEntityByIdMock.mockResolvedValue({ id: 'character-1', name: 'Geralt' });
  });

  it('rejects payloads for entities that are not allowed', async () => {
    const response = await POST(createRequest({ entity: 'not-a-real-entity' }) as never, segmentData('character-1'));

    expect(response.status).toBe(400);
    expect(searchEntityByIdMock).not.toHaveBeenCalled();
  });

  it('forwards the id and the x-api-key header to searchEntityById', async () => {
    const payload = { entity: 'character' };

    await POST(createRequest(payload, 'ABC') as never, segmentData('character-1'));

    expect(searchEntityByIdMock).toHaveBeenCalledWith('character-1', payload, 'ABC');
  });

  it('passes null when no x-api-key header is present', async () => {
    const payload = { entity: 'character' };

    await POST(createRequest(payload) as never, segmentData('character-1'));

    expect(searchEntityByIdMock).toHaveBeenCalledWith('character-1', payload, null);
  });

  it('returns whatever searchEntityById resolves with (including null for hidden characters)', async () => {
    searchEntityByIdMock.mockResolvedValue(null);

    const response = await POST(createRequest({ entity: 'character' }, 'WRONG-KEY') as never, segmentData('character-1'));

    await expect(response.json()).resolves.toBeNull();
  });

  it('returns a 500 with a generic message when searchEntityById throws', async () => {
    searchEntityByIdMock.mockRejectedValue(new Error('boom'));

    const response = await POST(createRequest({ entity: 'character' }) as never, segmentData('character-1'));

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({ message: 'Server error' });
  });
});
