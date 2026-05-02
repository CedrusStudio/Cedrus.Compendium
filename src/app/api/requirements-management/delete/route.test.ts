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

import { POST } from '@/app/api/requirements-management/delete/route';

describe('POST /api/requirements-management/delete', () => {
  beforeEach(() => {
    findMany.mockReset();
    update.mockReset();
  });

  it('deletes a requirement across all affected records', async () => {
    findMany.mockResolvedValueOnce([
      { id: '1', requirements: ['Alchemia', 'Bron'] },
      { id: '2', requirements: ['Alchemia', 'Zrecznosc'] },
    ]);
    update.mockResolvedValue({});

    const response = await POST(new Request('http://localhost/api/requirements-management/delete', {
      method: 'POST',
      body: JSON.stringify({ entity: 'perks', requirement: 'Alchemia' }),
      headers: { 'content-type': 'application/json' },
    }));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ updatedCount: 2 });
    expect(update).toHaveBeenNthCalledWith(1, {
      where: { id: '1' },
      data: { requirements: ['Bron'] },
    });
    expect(update).toHaveBeenNthCalledWith(2, {
      where: { id: '2' },
      data: { requirements: ['Zrecznosc'] },
    });
  });

  it('returns 400 for an unsupported entity', async () => {
    const response = await POST(new Request('http://localhost/api/requirements-management/delete', {
      method: 'POST',
      body: JSON.stringify({ entity: 'weapons', requirement: 'Alchemia' }),
      headers: { 'content-type': 'application/json' },
    }));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ message: 'Invalid entity: weapons' });
  });

  it('returns 400 when requirement is missing', async () => {
    const response = await POST(new Request('http://localhost/api/requirements-management/delete', {
      method: 'POST',
      body: JSON.stringify({ entity: 'perks', requirement: '' }),
      headers: { 'content-type': 'application/json' },
    }));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ message: 'requirement is required' });
  });

  it('returns 400 when requirement exceeds the allowed length', async () => {
    const response = await POST(new Request('http://localhost/api/requirements-management/delete', {
      method: 'POST',
      body: JSON.stringify({ entity: 'perks', requirement: 'a'.repeat(1001) }),
      headers: { 'content-type': 'application/json' },
    }));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ message: 'Requirements must contain between 1 and 1000 characters' });
  });

  it('returns 500 when the database throws', async () => {
    findMany.mockRejectedValueOnce(new Error('db error'));

    const response = await POST(new Request('http://localhost/api/requirements-management/delete', {
      method: 'POST',
      body: JSON.stringify({ entity: 'perks', requirement: 'Alchemia' }),
      headers: { 'content-type': 'application/json' },
    }));

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({ message: 'Server error' });
  });
});