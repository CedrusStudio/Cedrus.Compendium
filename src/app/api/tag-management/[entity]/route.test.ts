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

import { GET } from '@/app/api/tag-management/[entity]/route';

describe('GET /api/tag-management/[entity]', () => {
  beforeEach(() => {
    aggregateRaw.mockReset();
  });

  it('returns sorted tags with usage counts for a supported entity', async () => {
    aggregateRaw.mockResolvedValueOnce([
      { tag: 'alchemia', count: 2 },
      { tag: 'bron', count: 1 },
    ]);

    const response = await GET(new Request('http://localhost/api/tag-management/perks'), {
      params: Promise.resolve({ entity: 'perks' }),
    });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual([
      { tag: 'alchemia', count: 2 },
      { tag: 'bron', count: 1 },
    ]);
    expect(aggregateRaw).toHaveBeenCalledWith({
      pipeline: [
        { $unwind: '$tags' },
        {
          $group: {
            _id: '$tags',
            count: { $sum: 1 },
          },
        },
        {
          $project: {
            tag: '$_id',
            count: 1,
            _id: 0,
          },
        },
        {
          $sort: {
            tag: 1,
          },
        },
      ],
    });
  });

  it('returns 400 for an unsupported entity', async () => {
    const response = await GET(new Request('http://localhost/api/tag-management/unknown'), {
      params: Promise.resolve({ entity: 'unknown' }),
    });

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ message: 'Invalid entity: unknown' });
  });

  it('returns 500 when aggregation throws', async () => {
    aggregateRaw.mockRejectedValueOnce(new Error('db error'));

    const response = await GET(new Request('http://localhost/api/tag-management/perks'), {
      params: Promise.resolve({ entity: 'perks' }),
    });

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({ message: 'Server error' });
  });
});