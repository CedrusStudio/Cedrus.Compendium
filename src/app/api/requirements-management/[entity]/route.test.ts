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
});