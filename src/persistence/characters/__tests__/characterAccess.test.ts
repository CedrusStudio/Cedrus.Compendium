import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Prisma } from '@prisma/client';
import { createPendingDraft } from '@/__tests__/fixtures/aiCharacterDraft';
import { CharacterMembershipError, CharacterMembershipConflictError } from '../characterMembershipErrors';

const mocks = vi.hoisted(() => ({
  transaction: vi.fn(), find: vi.fn(), update: vi.fn(), remove: vi.fn(), weapon: vi.fn(),
}));
vi.mock('@/lib/env', () => ({ adminApiKeys: ['key-a', 'key-b'] }));
vi.mock('@/lib/prisma', () => ({ default: { $transaction: mocks.transaction } }));
import {
  deleteCharacter, updateCharacterStatistics, updateCharacterTalents, updateCharacterBuffs,
  updateCharacterEquipment, updateCharacterDetails, updateCharacterCombat,
} from '../charactersRepository';

const tx = {
  character: { findUnique: mocks.find, update: mocks.update, delete: mocks.remove },
  weapon: { findMany: mocks.weapon },
};
const sheet = createPendingDraft().proposal!;
const writes = [
  { name: 'delete', run: () => deleteCharacter('target', 'key-b') },
  { name: 'statistics', run: () => updateCharacterStatistics('target', sheet.statistics, 'key-b') },
  { name: 'talents', run: () => updateCharacterTalents('target', sheet.talents, 'key-b') },
  { name: 'buffs', run: () => updateCharacterBuffs('target', sheet.buffs, 'key-b') },
  { name: 'equipment', run: () => updateCharacterEquipment('target', sheet.equipment, 'key-b') },
  { name: 'details', run: () => updateCharacterDetails('target', { ...sheet.header, perks: [] }, { apiKey: 'key-b', expectedMembership: {} }) },
  { name: 'combat', run: () => updateCharacterCombat('target', sheet.combat, { apiKey: 'key-b', expectedMembership: {} }) },
];

beforeEach(() => {
  vi.resetAllMocks();
  mocks.transaction.mockImplementation((write: (db: typeof tx) => unknown) => write(tx));
  mocks.find.mockResolvedValue({ apiKeys: [], weaponsIds: [], armorsIds: [], shieldsIds: [], inventoryIds: [], mountsIds: [] });
  mocks.update.mockResolvedValue({ id: 'target' });
});

describe.each(writes)('$name character access boundary', ({ run }) => {
  it.each([null, { apiKeys: ['key-a'] }])('rejects missing/hidden character before any nested read or write (%j)', async record => {
    mocks.find.mockResolvedValue(record);
    await expect(run()).rejects.toMatchObject({ status: 404, message: 'Character not found' });
    expect(mocks.update).not.toHaveBeenCalled();
    expect(mocks.remove).not.toHaveBeenCalled();
    expect(mocks.weapon).not.toHaveBeenCalled();
    expect(mocks.transaction).toHaveBeenCalledWith(expect.any(Function), { timeout: 10_000 });
  });
});

describe('atomic section writes', () => {
  it.each([[], ['key-b'], undefined])('permits an authorized/public/legacy character: %j', async apiKeys => {
    mocks.find.mockResolvedValue({ apiKeys });
    await expect(updateCharacterStatistics('target', sheet.statistics, 'key-b')).resolves.toBe(true);
    expect(mocks.find).toHaveBeenCalledBefore(mocks.update);
    expect(mocks.update).toHaveBeenCalledExactlyOnceWith({ where: { id: 'target' }, data: sheet.statistics });
  });

  it('uses the same transaction for equipment reads and nested writes', async () => {
    const empty = { ...sheet.equipment, weapons: [], armors: [], shields: [], inventory: [], mounts: [] };
    await expect(updateCharacterEquipment('target', empty, 'key-b')).resolves.toBe(true);
    expect(mocks.find).toHaveBeenCalledTimes(2);
    expect(mocks.update).toHaveBeenCalledOnce();
  });

  it.each(['P2025', 'P2034'])('surfaces an access-change/write conflict without retrying stale work (%s)', async code => {
    mocks.update.mockRejectedValue(new Prisma.PrismaClientKnownRequestError('write conflict', { code, clientVersion: 'test' }));
    await expect(updateCharacterStatistics('target', sheet.statistics, 'key-b')).rejects.toBeInstanceOf(CharacterMembershipConflictError);
    expect(mocks.transaction).toHaveBeenCalledOnce();
  });

  it('propagates unexpected failures so the transaction aborts', async () => {
    const failure = new Error('write failed');
    mocks.update.mockRejectedValue(failure);
    await expect(updateCharacterStatistics('target', sheet.statistics, 'key-b')).rejects.toBe(failure);
    expect(failure).not.toBeInstanceOf(CharacterMembershipError);
  });
});
