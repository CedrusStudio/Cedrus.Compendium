import { beforeEach, describe, expect, it, vi } from 'vitest';

const { findMany, runCommandRaw, profileFindMany, profileUpdate, count, deleteMany } = vi.hoisted(() => ({
  findMany: vi.fn(),
  runCommandRaw: vi.fn(),
  profileFindMany: vi.fn(),
  profileUpdate: vi.fn(),
  count: vi.fn(),
  deleteMany: vi.fn(),
}));

// A Proxy stands in for the real client because `removeOrphanedDefinition` walks
// EVERY entity to prove the tag is gone before dropping the definition. Mocking
// only `perk` would make it bail out on the first unknown model — which is the
// correct fail-safe, but not what these tests are exercising.
vi.mock('@/lib/prisma', () => {
  const named: Record<string, unknown> = {
    $runCommandRaw: runCommandRaw,
    personalizationProfileRecord: { findMany: profileFindMany, update: profileUpdate },
    tagDefinition: { findFirst: vi.fn(), update: vi.fn(), deleteMany },
  };

  return {
    default: new Proxy(named, {
      get: (target, property) =>
      {
        if (typeof property !== 'string') return undefined;
        return property in target ? target[property] : { findMany, count };
      },
    }),
  };
});

import { POST } from '@/app/api/tag-management/delete/route';

const post = (body: unknown) => POST(new Request('http://localhost/api/tag-management/delete', {
  method: 'POST',
  body: JSON.stringify(body),
  headers: { 'content-type': 'application/json' },
}));

describe('POST /api/tag-management/delete', () => {
  beforeEach(() => {
    findMany.mockReset();
    runCommandRaw.mockReset();
    profileFindMany.mockReset();
    profileUpdate.mockReset();
    count.mockReset();
    deleteMany.mockReset();

    findMany.mockImplementation((args: { select?: Record<string, boolean> }) =>
      args?.select?.structuredRequirements
        ? Promise.resolve([])
        : Promise.resolve([{ id: '1', name: 'Atut A' }, { id: '2', name: 'Atut B' }]));
    profileFindMany.mockResolvedValue([]);
    runCommandRaw.mockResolvedValue({});
    profileUpdate.mockResolvedValue({});
    // Other entities still carry the tag, so the definition must survive.
    count.mockResolvedValue(1);
    deleteMany.mockResolvedValue({ count: 1 });
  });

  it('strips the tag with a single raw command and names the affected records', async () => {
    const response = await post({ entity: 'perks', tag: 'miecze' });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      updatedCount: 2,
      records: 2,
      affectedNames: ['Atut A', 'Atut B'],
    });

    expect(runCommandRaw).toHaveBeenCalledTimes(1);
    expect(runCommandRaw).toHaveBeenCalledWith({
      update: 'perks',
      updates: [{ q: { tags: 'miecze' }, u: { $pull: { tags: 'miecze' } }, multi: true }],
    });
  });

  it('counts requirements left pointing at the tag without editing them', async () => {
    findMany.mockImplementation((args: { select?: Record<string, boolean> }) =>
      args?.select?.structuredRequirements
        ? Promise.resolve([{ structuredRequirements: [{ kind: 'count', groups: ['perks'], tag: 'miecze', value: 2 }] }])
        : Promise.resolve([{ id: '1', name: 'Atut A' }]));

    await expect((await post({ entity: 'perks', tag: 'miecze' })).json())
      .resolves.toMatchObject({ strandedRequirements: 1 });
  });

  it('removes the tag from quick tags in the deleted entity\'s context only', async () => {
    profileFindMany.mockResolvedValue([{
      id: 'prof1',
      profile: JSON.stringify({ quickTagsByContext: { perks: ['miecze', 'stal'], maneuvers: ['miecze'] }, quickExcludeTagsByContext: {} }),
    }]);

    await expect((await post({ entity: 'perks', tag: 'miecze' })).json()).resolves.toMatchObject({ profiles: 1 });

    const written = JSON.parse(profileUpdate.mock.calls[0]![0].data.profile);
    expect(written.quickTagsByContext).toEqual({ perks: ['stal'], maneuvers: ['miecze'] });
  });

  it('keeps the definition while another entity still carries the tag', async () => {
    await expect((await post({ entity: 'perks', tag: 'miecze' })).json())
      .resolves.toMatchObject({ definitionRemoved: false });
    expect(deleteMany).not.toHaveBeenCalled();
  });

  it('removes the orphaned definition once the tag is gone everywhere', async () => {
    count.mockResolvedValue(0);

    await expect((await post({ entity: 'perks', tag: 'miecze' })).json())
      .resolves.toMatchObject({ definitionRemoved: true });
    expect(deleteMany).toHaveBeenCalledWith({ where: { tag: 'miecze' } });
  });

  it('writes nothing in dry-run but reports the same counts', async () => {
    const response = await post({ entity: 'perks', tag: 'miecze', dryRun: true });

    await expect(response.json()).resolves.toMatchObject({ records: 2, dryRun: true });
    expect(runCommandRaw).not.toHaveBeenCalled();
    expect(profileUpdate).not.toHaveBeenCalled();
    expect(deleteMany).not.toHaveBeenCalled();
  });

  it('returns 400 for an unsupported entity', async () => {
    const response = await post({ entity: 'unknown', tag: 'miecze' });

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ message: 'Invalid entity: unknown' });
  });

  it('returns 400 when tag is missing', async () => {
    const response = await post({ entity: 'perks', tag: '' });

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ message: 'tag is required' });
  });

  it('returns 400 for a tag that is not a lowercase single word', async () => {
    const response = await post({ entity: 'perks', tag: 'Nowy Tag' });

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ message: 'Tags must be lowercase single words' });
  });

  it('returns 500 when the database throws', async () => {
    findMany.mockReset();
    findMany.mockRejectedValue(new Error('db error'));

    const response = await post({ entity: 'perks', tag: 'miecze' });

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({ message: 'Server error' });
  });
});
