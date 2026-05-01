import { beforeEach, describe, expect, it, vi } from 'vitest';

const { adminApiKeys } = vi.hoisted(() => ({
  adminApiKeys: ['alpha', 'beta'] as string[],
}));

vi.mock('@/lib/env', () => ({
  adminApiKeys,
}));

import { API_KEY_HEADER } from '@/proxy';
import { GET } from '@/app/api/admin/capabilities/route';

describe('GET /api/admin/capabilities', () => {
  beforeEach(() => {
    adminApiKeys.splice(0, adminApiKeys.length, 'alpha', 'beta');
  });

  it('returns isAdmin=true for a configured admin key', async () => {
    const response = await GET(new Request('http://localhost/api/admin/capabilities', {
      headers: { [API_KEY_HEADER]: 'alpha' },
    }));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ isAdmin: true });
  });

  it('returns isAdmin=false when the key is missing or invalid', async () => {
    const missingKeyResponse = await GET(new Request('http://localhost/api/admin/capabilities'));
    const invalidKeyResponse = await GET(new Request('http://localhost/api/admin/capabilities', {
      headers: { [API_KEY_HEADER]: 'gamma' },
    }));

    await expect(missingKeyResponse.json()).resolves.toEqual({ isAdmin: false });
    await expect(invalidKeyResponse.json()).resolves.toEqual({ isAdmin: false });
  });
});