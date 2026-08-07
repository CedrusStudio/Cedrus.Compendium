import { beforeEach, describe, expect, it, vi } from 'vitest';

const { findMany, update, runCommandRaw, profileFindMany, profileUpdate } = vi.hoisted(() => ({
  findMany: vi.fn(),
  update: vi.fn(),
  runCommandRaw: vi.fn(),
  profileFindMany: vi.fn(),
  profileUpdate: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({
  default: {
    $runCommandRaw: runCommandRaw,
    perk: { findMany, update },
    personalizationProfileRecord: { findMany: profileFindMany, update: profileUpdate },
  },
}));

import { POST } from '@/app/api/tag-management/rename/route';

const post = (body: unknown) => POST(new Request('http://localhost/api/tag-management/rename', {
  method: 'POST',
  body: JSON.stringify(body),
  headers: { 'content-type': 'application/json' },
}));

describe('POST /api/tag-management/rename', () => {
  beforeEach(() => {
    findMany.mockReset();
    update.mockReset();
    runCommandRaw.mockReset();
    profileFindMany.mockReset();
    profileUpdate.mockReset();

    // Default: two records carry the tag, no requirements, no profiles.
    findMany.mockImplementation((args: { select?: Record<string, boolean> }) =>
      args?.select?.structuredRequirements
        ? Promise.resolve([])
        : Promise.resolve([{ id: '1', tags: ['miecze', 'bron'] }, { id: '2', tags: ['miecze', 'stal'] }]));
    profileFindMany.mockResolvedValue([]);
    runCommandRaw.mockResolvedValue({});
    update.mockResolvedValue({});
    profileUpdate.mockResolvedValue({});
  });

  it('renames the tag with a single raw command instead of one update per record', async () => {
    const response = await post({ entity: 'perks', oldTag: 'miecze', newTag: 'ostrza' });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({ updatedCount: 2, records: 2, merged: 0, dryRun: false });

    expect(runCommandRaw).toHaveBeenCalledTimes(1);
    expect(runCommandRaw).toHaveBeenCalledWith({
      update: 'perks',
      updates: [{
        q: { tags: 'miecze' },
        u: { $set: { 'tags.$[element]': 'ostrza' } },
        multi: true,
        arrayFilters: [{ element: 'miecze' }],
      }],
    });
  });

  it('pulls the old tag first from records that already carry the new one, so no duplicate is created', async () => {
    findMany.mockImplementation((args: { select?: Record<string, boolean> }) =>
      args?.select?.structuredRequirements
        ? Promise.resolve([])
        : Promise.resolve([{ id: '1', tags: ['miecze', 'ostrza'] }, { id: '2', tags: ['miecze'] }]));

    const response = await post({ entity: 'perks', oldTag: 'miecze', newTag: 'ostrza' });

    await expect(response.json()).resolves.toMatchObject({ records: 2, merged: 1 });
    expect(runCommandRaw).toHaveBeenNthCalledWith(1, {
      update: 'perks',
      updates: [{ q: { $and: [{ tags: 'miecze' }, { tags: 'ostrza' }] }, u: { $pull: { tags: 'miecze' } }, multi: true }],
    });
    expect(runCommandRaw).toHaveBeenCalledTimes(2);
  });

  it('repoints count requirements that reference the tag', async () => {
    findMany.mockImplementation((args: { select?: Record<string, boolean> }) =>
      args?.select?.structuredRequirements
        ? Promise.resolve([{ id: 'p1', structuredRequirements: [{ kind: 'count', groups: ['perks'], tag: 'miecze', value: 2 }] }])
        : Promise.resolve([{ id: '1', tags: ['miecze'] }]));

    const response = await post({ entity: 'perks', oldTag: 'miecze', newTag: 'ostrza' });

    await expect(response.json()).resolves.toMatchObject({ requirementReferences: 1 });
    expect(update).toHaveBeenCalledWith({
      where: { id: 'p1' },
      data: { structuredRequirements: [{ kind: 'count', groups: ['perks'], tag: 'ostrza', value: 2 }] },
    });
  });

  it('rewrites quick tags in the personalization profiles, in the renamed entity\'s context only', async () => {
    profileFindMany.mockResolvedValue([{
      id: 'prof1',
      profile: JSON.stringify({ quickTagsByContext: { perks: ['miecze'], maneuvers: ['miecze'] }, quickExcludeTagsByContext: {} }),
    }]);

    const response = await post({ entity: 'perks', oldTag: 'miecze', newTag: 'ostrza' });

    await expect(response.json()).resolves.toMatchObject({ profiles: 1 });

    const written = JSON.parse(profileUpdate.mock.calls[0]![0].data.profile);
    expect(written.quickTagsByContext).toEqual({ perks: ['ostrza'], maneuvers: ['miecze'] });
  });

  it('writes nothing in dry-run but reports the same counts', async () => {
    profileFindMany.mockResolvedValue([{
      id: 'prof1',
      profile: JSON.stringify({ quickTagsByContext: { perks: ['miecze'] }, quickExcludeTagsByContext: {} }),
    }]);

    const response = await post({ entity: 'perks', oldTag: 'miecze', newTag: 'ostrza', dryRun: true });

    await expect(response.json()).resolves.toMatchObject({ records: 2, profiles: 1, dryRun: true });
    expect(runCommandRaw).not.toHaveBeenCalled();
    expect(update).not.toHaveBeenCalled();
    expect(profileUpdate).not.toHaveBeenCalled();
  });

  it('rejects invalid target tags', async () => {
    const response = await post({ entity: 'perks', oldTag: 'miecze', newTag: 'Nowy Tag' });

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ message: 'Tags must be lowercase single words' });
  });

  it('returns 400 for an unsupported entity', async () => {
    const response = await post({ entity: 'unknown', oldTag: 'miecze', newTag: 'ostrza' });

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ message: 'Invalid entity: unknown' });
  });

  it('returns 400 when newTag is missing', async () => {
    const response = await post({ entity: 'perks', oldTag: 'miecze', newTag: '' });

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ message: 'Both oldTag and newTag are required' });
  });

  it('returns 400 when the old and new tag are identical', async () => {
    const response = await post({ entity: 'perks', oldTag: 'miecze', newTag: 'miecze' });

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ message: 'newTag must be different from oldTag' });
  });

  it('returns 500 when the database throws', async () => {
    findMany.mockReset();
    findMany.mockRejectedValue(new Error('db error'));

    const response = await post({ entity: 'perks', oldTag: 'miecze', newTag: 'ostrza' });

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({ message: 'Server error' });
  });
});
