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
});