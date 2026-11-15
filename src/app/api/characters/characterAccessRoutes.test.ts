import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { createPendingDraft } from '@/__tests__/fixtures/aiCharacterDraft';
import { CharacterMembershipError, CharacterMembershipConflictError } from '@/persistence/characters/characterMembershipErrors';

const repository = vi.hoisted(() => ({
  getCharactersVisibleToApiKeyByIds: vi.fn(), addCharacter: vi.fn(), deleteCharacter: vi.fn(),
  updateCharacterStatistics: vi.fn(), updateCharacterTalents: vi.fn(),
  updateCharacterBuffs: vi.fn(), updateCharacterEquipment: vi.fn(),
}));
vi.mock('@/lib/env', () => ({ adminApiKeys: ['key-a', 'key-b'] }));
vi.mock('@/persistence/characters/charactersRepository', () => repository);

import { POST as byIds } from './by-ids/route';
import { POST as create } from './route';
import { DELETE as remove } from './[id]/route';
import { PUT as statistics } from './[id]/statistics/route';
import { PUT as talents } from './[id]/talents/route';
import { PUT as buffs } from './[id]/buffs/route';
import { PUT as equipment } from './[id]/equipment/route';

function request(method: string, body: unknown, key: string | null = 'key-b', raw?: string) {
  return new NextRequest('http://localhost/api/characters', {
    method, headers: { 'Content-Type': 'application/json', ...(key ? { 'x-api-key': key } : {}) },
    ...(method !== 'DELETE' ? { body: raw ?? JSON.stringify(body) } : {}),
  });
}
const context = (id = 'character') => ({ params: Promise.resolve({ id }) });
const sheet = createPendingDraft().proposal!;
const updates = [
  { name: 'statistics', handle: statistics, write: repository.updateCharacterStatistics, body: sheet.statistics },
  { name: 'talents', handle: talents, write: repository.updateCharacterTalents, body: sheet.talents },
  { name: 'buffs', handle: buffs, write: repository.updateCharacterBuffs, body: sheet.buffs },
  { name: 'equipment', handle: equipment, write: repository.updateCharacterEquipment, body: sheet.equipment },
];

beforeEach(() => {
  vi.clearAllMocks();
  for (const fn of Object.values(repository)) fn.mockReset();
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

describe('character batch reads', () => {
  it.each([null, 'bad'])('requires a valid key (%s)', async key => {
    const response = await byIds(request('POST', { ids: ['known-private-id'] }, key));
    expect(response.status).toBe(key ? 403 : 401);
    expect(repository.getCharactersVisibleToApiKeyByIds).not.toHaveBeenCalled();
  });

  it.each([null, [], {}, { ids: [7] }, { ids: [''] }, { ids: ['   '] }, { ids: ['x'.repeat(201)] }, { ids: Array(201).fill('id') }])(
    'rejects an invalid or oversized batch without querying: %j', async body => {
      expect((await byIds(request('POST', body))).status).toBe(400);
      expect(repository.getCharactersVisibleToApiKeyByIds).not.toHaveBeenCalled();
    },
  );

  it('rejects malformed JSON', async () => {
    expect((await byIds(request('POST', null, 'key-b', '{'))).status).toBe(400);
    expect(repository.getCharactersVisibleToApiKeyByIds).not.toHaveBeenCalled();
  });

  it('deduplicates IDs and supplies caller identity, preserving the response array', async () => {
    repository.getCharactersVisibleToApiKeyByIds.mockResolvedValue([{ id: 'public' }]);
    const response = await byIds(request('POST', { ids: ['public', 'private', 'public'], apiKey: 'key-a' }));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual([{ id: 'public' }]);
    expect(repository.getCharactersVisibleToApiKeyByIds).toHaveBeenCalledExactlyOnceWith(['public', 'private'], 'key-b');
  });
});

describe.each(updates)('character $name writes', ({ handle, write, body }) => {
  it.each([null, 'bad'])('requires a valid key (%s)', async key => {
    expect((await handle(request('PUT', body, key), context())).status).toBe(key ? 403 : 401);
    expect(write).not.toHaveBeenCalled();
  });

  it('rejects missing ID and malformed input before writing', async () => {
    expect((await handle(request('PUT', body), context(''))).status).toBe(400);
    expect((await handle(request('PUT', null), context())).status).toBe(400);
    expect((await handle(request('PUT', null, 'key-b', '{'), context())).status).toBe(400);
    expect(write).not.toHaveBeenCalled();
  });

  it('passes only the validated key and preserves the successful response', async () => {
    write.mockResolvedValue(true);
    const response = await handle(request('PUT', body), context());
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ status: 200 });
    expect(write).toHaveBeenCalledExactlyOnceWith('character', expect.any(Object), 'key-b');
  });

  it('returns the same 404 for a missing or inaccessible character', async () => {
    write.mockRejectedValue(new CharacterMembershipError(404, 'Character not found'));
    const response = await handle(request('PUT', body), context());
    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ message: 'Character not found' });
  });

  it('surfaces a transaction conflict and hides unexpected failures', async () => {
    write.mockRejectedValueOnce(new CharacterMembershipConflictError());
    expect((await handle(request('PUT', body), context())).status).toBe(409);
    write.mockRejectedValueOnce(new Error('private database details'));
    const response = await handle(request('PUT', body), context());
    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ message: 'Server error' });
  });
});

describe('character deletion', () => {
  it('authenticates and forwards the key while preserving the success body', async () => {
    expect((await remove(request('DELETE', null, null), context())).status).toBe(401);
    expect((await remove(request('DELETE', null, 'bad'), context())).status).toBe(403);
    expect(repository.deleteCharacter).not.toHaveBeenCalled();
    const response = await remove(request('DELETE', null), context());
    expect(await response.json()).toEqual({ status: 204 });
    expect(repository.deleteCharacter).toHaveBeenCalledExactlyOnceWith('character', 'key-b');
  });

  it('does not disguise internal failures as missing characters', async () => {
    repository.deleteCharacter.mockRejectedValueOnce(new CharacterMembershipError(404, 'Character not found'));
    expect((await remove(request('DELETE', null), context())).status).toBe(404);
    repository.deleteCharacter.mockRejectedValueOnce(new Error('database unavailable'));
    expect((await remove(request('DELETE', null), context())).status).toBe(500);
  });
});

describe('character creation validation', () => {
  it.each([null, [], {}, { ...sheet.header, shortName: 'invalid name' }])('rejects invalid headers: %j', async body => {
    expect((await create(request('POST', body))).status).toBe(400);
    expect(repository.addCharacter).not.toHaveBeenCalled();
  });

  it('rejects malformed JSON and unauthenticated creation', async () => {
    expect((await create(request('POST', null, 'key-b', '{'))).status).toBe(400);
    expect((await create(request('POST', sheet.header, null))).status).toBe(401);
    expect(repository.addCharacter).not.toHaveBeenCalled();
  });

  it('uses the parsed header and preserves the created-ID response', async () => {
    repository.addCharacter.mockResolvedValue('created');
    const response = await create(request('POST', { ...sheet.header, apiKeys: ['key-a'], unexpected: true }));
    expect(response.status).toBe(201);
    expect(await response.json()).toBe('created');
    expect(repository.addCharacter).toHaveBeenCalledExactlyOnceWith(sheet.header);
  });
});
