import { beforeEach, describe, expect, it, vi } from 'vitest';

const { searchEntityMock } = vi.hoisted(() => ({
  searchEntityMock: vi.fn(),
}));

vi.mock('@/persistence/searchEntity', () => ({
  searchEntity: searchEntityMock,
}));

import { API_KEY_HEADER } from '@/proxy';
import { POST } from '@/app/api/search/route';

function createRequest(body: unknown, apiKey?: string)
{
  const headers = new Headers({ 'Content-Type': 'application/json' });
  if (apiKey) headers.set(API_KEY_HEADER, apiKey);

  return new Request('http://localhost/api/search', {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });
}

describe('POST /api/search', () => {
  beforeEach(() => {
    searchEntityMock.mockReset();
    searchEntityMock.mockResolvedValue([]);
  });

  it('rejects payloads for entities that are not allowed', async () => {
    const response = await POST(createRequest({ entity: 'not-a-real-entity' }) as never);

    expect(response.status).toBe(400);
    expect(searchEntityMock).not.toHaveBeenCalled();
  });

  it('forwards the x-api-key header to searchEntity when present', async () => {
    const payload = { entity: 'character' };

    await POST(createRequest(payload, 'ABC') as never);

    expect(searchEntityMock).toHaveBeenCalledWith(payload, 'ABC');
  });

  it('passes null to searchEntity when no x-api-key header is present', async () => {
    const payload = { entity: 'character' };

    await POST(createRequest(payload) as never);

    expect(searchEntityMock).toHaveBeenCalledWith(payload, null);
  });

  it('still works (and passes null) for entities that do not use apiKeys, like maneuver', async () => {
    const payload = { entity: 'maneuver' };

    await POST(createRequest(payload) as never);

    expect(searchEntityMock).toHaveBeenCalledWith(payload, null);
  });

  it('returns a 500 with a generic message when searchEntity throws', async () => {
    searchEntityMock.mockRejectedValue(new Error('boom'));

    const response = await POST(createRequest({ entity: 'character' }) as never);

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({ message: 'Server error' });
  });
});
