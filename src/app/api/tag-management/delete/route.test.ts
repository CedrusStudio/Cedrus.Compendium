import { beforeEach, describe, expect, it, vi } from 'vitest';

const { findMany, update } = vi.hoisted(() => ({
  findMany: vi.fn(),
  update: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({
  default: {
    perk: {
      findMany,
      update,
    },
  },
}));

import { POST } from '@/app/api/tag-management/delete/route';

describe('POST /api/tag-management/delete', () => {
  beforeEach(() => {
    findMany.mockReset();
    update.mockReset();
  });

  it('deletes a tag across all affected records', async () => {
    findMany.mockResolvedValueOnce([
      { id: '1', tags: ['miecze', 'bron'] },
      { id: '2', tags: ['miecze', 'stal'] },
    ]);
    update.mockResolvedValue({});

    const response = await POST(new Request('http://localhost/api/tag-management/delete', {
      method: 'POST',
      body: JSON.stringify({ entity: 'perks', tag: 'miecze' }),
      headers: { 'content-type': 'application/json' },
    }));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ updatedCount: 2 });
    expect(update).toHaveBeenNthCalledWith(1, {
      where: { id: '1' },
      data: { tags: ['bron'] },
    });
    expect(update).toHaveBeenNthCalledWith(2, {
      where: { id: '2' },
      data: { tags: ['stal'] },
    });
  });

  it('returns 400 for an unsupported entity', async () => {
    const response = await POST(new Request('http://localhost/api/tag-management/delete', {
      method: 'POST',
      body: JSON.stringify({ entity: 'unknown', tag: 'miecze' }),
      headers: { 'content-type': 'application/json' },
    }));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ message: 'Invalid entity: unknown' });
  });

  it('returns 400 when tag is missing', async () => {
    const response = await POST(new Request('http://localhost/api/tag-management/delete', {
      method: 'POST',
      body: JSON.stringify({ entity: 'perks', tag: '' }),
      headers: { 'content-type': 'application/json' },
    }));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ message: 'tag is required' });
  });

  it('returns 400 for a tag that is not a lowercase single word', async () => {
    const response = await POST(new Request('http://localhost/api/tag-management/delete', {
      method: 'POST',
      body: JSON.stringify({ entity: 'perks', tag: 'Nowy Tag' }),
      headers: { 'content-type': 'application/json' },
    }));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ message: 'Tags must be lowercase single words' });
  });

  it('returns 500 when the database throws', async () => {
    findMany.mockRejectedValueOnce(new Error('db error'));

    const response = await POST(new Request('http://localhost/api/tag-management/delete', {
      method: 'POST',
      body: JSON.stringify({ entity: 'perks', tag: 'miecze' }),
      headers: { 'content-type': 'application/json' },
    }));

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({ message: 'Server error' });
  });
});