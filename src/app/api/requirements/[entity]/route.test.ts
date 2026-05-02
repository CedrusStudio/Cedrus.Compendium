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

import { GET } from '@/app/api/requirements/[entity]/route';

describe('GET /api/requirements/[entity]', () => {
  beforeEach(() => {
    aggregateRaw.mockReset();
  });

  it('returns sorted unique requirements for a supported entity', async () => {
    aggregateRaw.mockResolvedValueOnce([{ uniqueRequirements: ['Zwinność', 'Alchemia'] }]);

    const response = await GET(new Request('http://localhost/api/requirements/perks'), {
      params: Promise.resolve({ entity: 'perks' }),
    });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual(['Alchemia', 'Zwinność']);
    expect(aggregateRaw).toHaveBeenCalledWith({
      pipeline: [
        { $unwind: '$requirements' },
        {
          $group: {
            _id: null,
            uniqueRequirements: { $addToSet: '$requirements' },
          },
        },
        {
          $project: {
            uniqueRequirements: 1,
            _id: 0,
          },
        },
      ],
    });
  });

  it('rejects unsupported entities', async () => {
    const response = await GET(new Request('http://localhost/api/requirements/weapons'), {
      params: Promise.resolve({ entity: 'weapons' }),
    });

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ message: 'Invalid entity: weapons' });
  });

  it('returns 500 when aggregation throws', async () => {
    aggregateRaw.mockRejectedValueOnce(new Error('db error'));

    const response = await GET(new Request('http://localhost/api/requirements/perks'), {
      params: Promise.resolve({ entity: 'perks' }),
    });

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({ message: 'Server error' });
  });
});