import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { NextRequest } from 'next/server';

const { adminApiKeys } = vi.hoisted(() => ({
  adminApiKeys: ['alpha', 'beta'] as string[],
}));

vi.mock('@/lib/env', () => ({
  adminApiKeys,
}));

import { API_KEY_HEADER, proxy } from '@/proxy';

function createRequest(pathname: string, method: string, apiKey?: string)
{
  const headers = new Headers();

  if (apiKey)
  {
    headers.set(API_KEY_HEADER, apiKey);
  }

  return {
    nextUrl: new URL(`http://localhost${pathname}`),
    method,
    headers,
  } as NextRequest;
}

describe('proxy', () => {
  beforeEach(() => {
    adminApiKeys.splice(0, adminApiKeys.length, 'alpha', 'beta');
  });

  it('accepts any configured admin API key for write requests', async () => {
    const response = proxy(createRequest('/api/characters', 'POST', 'beta'));

    expect(response.status).toBe(200);
  });

  it('rejects invalid API keys for write requests', async () => {
    const response = proxy(createRequest('/api/characters', 'POST', 'invalid'));

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({ error: 'Forbidden', message: 'Invalid API key' });
  });

  it('returns a server configuration error when no admin keys are configured', async () => {
    adminApiKeys.splice(0, adminApiKeys.length);

    const response = proxy(createRequest('/api/characters', 'POST', 'alpha'));

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      error: 'Server Configuration Error',
      message: 'API authentication not configured',
    });
  });

  it('rejects write requests that carry no API key header', async () => {
    const response = proxy(createRequest('/api/characters', 'POST'));

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: 'Unauthorized', message: 'API key is required' });
  });
});