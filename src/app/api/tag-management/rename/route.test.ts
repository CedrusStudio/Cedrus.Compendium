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

import { POST } from '@/app/api/tag-management/rename/route';

describe('POST /api/tag-management/rename', () => {
  beforeEach(() => {
    findMany.mockReset();
    update.mockReset();
  });

  it('renames a tag across all affected records and deduplicates the result', async () => {
    findMany.mockResolvedValueOnce([
      { id: '1', tags: ['miecze', 'bron'] },
      { id: '2', tags: ['miecze', 'ostrza', 'stal'] },
    ]);
    update.mockResolvedValue({});

    const response = await POST(new Request('http://localhost/api/tag-management/rename', {
      method: 'POST',
      body: JSON.stringify({ entity: 'perks', oldTag: 'miecze', newTag: 'ostrza' }),
      headers: { 'content-type': 'application/json' },
    }));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ updatedCount: 2 });
    expect(findMany).toHaveBeenCalledWith({
      where: { tags: { has: 'miecze' } },
      select: { id: true, tags: true },
    });
    expect(update).toHaveBeenNthCalledWith(1, {
      where: { id: '1' },
      data: { tags: ['ostrza', 'bron'] },
    });
    expect(update).toHaveBeenNthCalledWith(2, {
      where: { id: '2' },
      data: { tags: ['ostrza', 'stal'] },
    });
  });

  it('rejects invalid target tags', async () => {
    const response = await POST(new Request('http://localhost/api/tag-management/rename', {
      method: 'POST',
      body: JSON.stringify({ entity: 'perks', oldTag: 'miecze', newTag: 'Nowy Tag' }),
      headers: { 'content-type': 'application/json' },
    }));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ message: 'Tags must be lowercase single words' });
  });
});