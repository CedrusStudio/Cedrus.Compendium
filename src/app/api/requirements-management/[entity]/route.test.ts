import { beforeEach, describe, expect, it, vi } from 'vitest';

const { aggregateRaw } = vi.hoisted(() => ({
  aggregateRaw: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({
  default: {
    perk: {
      aggregateRaw,
    },
  },
}));

import { GET } from '@/app/api/requirements-management/[entity]/route';

describe('GET /api/requirements-management/[entity]', () => {
  beforeEach(() => {
    aggregateRaw.mockReset();
  });

  it('returns sorted requirements with usage counts for a supported entity', async () => {
    aggregateRaw.mockResolvedValueOnce([
      { requirement: 'Alchemia', count: 2 },
      { requirement: 'Zrecznosc', count: 1 },
    ]);

    const response = await GET(new Request('http://localhost/api/requirements-management/perks'), {
      params: Promise.resolve({ entity: 'perks' }),
    });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual([
      { requirement: 'Alchemia', count: 2 },
      { requirement: 'Zrecznosc', count: 1 },
    ]);
    expect(aggregateRaw).toHaveBeenCalledWith({
      pipeline: [
        { $unwind: '$requirements' },
        {
          $group: {
            _id: '$requirements',
            count: { $sum: 1 },
          },
        },
        {
          $project: {
            requirement: '$_id',
            count: 1,
            _id: 0,
          },
        },
        {
          $sort: {
            requirement: 1,
          },
        },
      ],
    });
  });

  it('returns 400 for an unsupported entity', async () => {
    const response = await GET(new Request('http://localhost/api/requirements-management/weapons'), {
      params: Promise.resolve({ entity: 'weapons' }),
    });

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ message: 'Invalid entity: weapons' });
  });

  it('returns 500 when aggregation throws', async () => {
    aggregateRaw.mockRejectedValueOnce(new Error('db error'));

    const response = await GET(new Request('http://localhost/api/requirements-management/perks'), {
      params: Promise.resolve({ entity: 'perks' }),
    });

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({ message: 'Server error' });
  });
});