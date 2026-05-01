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

import { POST } from '@/app/api/requirements-management/rename/route';

describe('POST /api/requirements-management/rename', () => {
  beforeEach(() => {
    findMany.mockReset();
    update.mockReset();
  });

  it('renames a requirement across all affected records and deduplicates the result', async () => {
    findMany.mockResolvedValueOnce([
      { id: '1', requirements: ['Alchemia', 'Bron'] },
      { id: '2', requirements: ['Alchemia', 'Zrecznosc', 'Bron'] },
    ]);
    update.mockResolvedValue({});

    const response = await POST(new Request('http://localhost/api/requirements-management/rename', {
      method: 'POST',
      body: JSON.stringify({ entity: 'perks', oldRequirement: 'Alchemia', newRequirement: 'Zrecznosc' }),
      headers: { 'content-type': 'application/json' },
    }));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ updatedCount: 2 });
    expect(update).toHaveBeenNthCalledWith(1, {
      where: { id: '1' },
      data: { requirements: ['Zrecznosc', 'Bron'] },
    });
    expect(update).toHaveBeenNthCalledWith(2, {
      where: { id: '2' },
      data: { requirements: ['Zrecznosc', 'Bron'] },
    });
  });

  it('rejects invalid target requirements', async () => {
    const response = await POST(new Request('http://localhost/api/requirements-management/rename', {
      method: 'POST',
      body: JSON.stringify({ entity: 'perks', oldRequirement: 'Alchemia', newRequirement: '' }),
      headers: { 'content-type': 'application/json' },
    }));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ message: 'Both oldRequirement and newRequirement are required' });
  });
});