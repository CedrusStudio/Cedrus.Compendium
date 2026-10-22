import { beforeEach, describe, expect, it, vi } from 'vitest';
import { membershipSnapshot } from '@/domain/characters/characterMembership';
import { CharacterMembershipConflictError } from '../characterMembershipErrors';

const mocks = vi.hoisted(() => ({
  transaction: vi.fn(), findCharacter: vi.fn(), updateCharacter: vi.fn(), findPerk: vi.fn(),
}));
vi.mock('@/lib/prisma', () => ({ default: { $transaction: mocks.transaction } }));
vi.mock('@/lib/env', () => ({ adminApiKeys: ['key'] }));

import { updateCharacterDetails } from '../charactersRepository';
import { setCharacterMembership } from '../characterMembershipRepository';

const tx = {
  character: { findUnique: mocks.findCharacter, update: mocks.updateCharacter },
  perk: { findUnique: mocks.findPerk },
};

describe('character write transaction timeout', () => {
  beforeEach(() => {
    mocks.transaction.mockReset().mockImplementation((write: (db: typeof tx) => unknown) => write(tx));
    mocks.findCharacter.mockReset().mockResolvedValue({ id: 'character', apiKeys: [], raceId: null, ...membershipSnapshot({}) });
    mocks.updateCharacter.mockReset().mockResolvedValue({ id: 'character', ...membershipSnapshot({}), perks: [] });
    mocks.findPerk.mockReset().mockResolvedValue({ id: 'perk' });
  });

  it('gives the guarded details form save ten seconds while retaining its snapshot check', async () => {
    await expect(updateCharacterDetails('character', {
      name: 'Test', shortName: 'Test', description: '', tags: [], perks: [],
    }, { expectedMembership: { perksIds: [] }, apiKey: 'key' })).resolves.toEqual(membershipSnapshot({}));
    expect(mocks.transaction).toHaveBeenCalledWith(expect.any(Function), { timeout: 10_000 });
    expect(mocks.updateCharacter).toHaveBeenCalledOnce();
    expect(mocks.findCharacter).toHaveBeenCalledOnce();
  });

  it.each([true, false])('gives a scope membership change ten seconds (present=%s)', async present => {
    mocks.findCharacter.mockResolvedValue({ id: 'character', apiKeys: [], ...membershipSnapshot({ perksIds: present ? [] : ['perk'] }) });
    await expect(setCharacterMembership('character', 'perks', 'perk', present, 'key')).resolves.toMatchObject({ changed: true, present });
    expect(mocks.transaction).toHaveBeenCalledWith(expect.any(Function), { timeout: 10_000 });
    expect(mocks.updateCharacter).toHaveBeenCalledWith(expect.objectContaining({
      data: { perks: { [present ? 'connect' : 'disconnect']: { id: 'perk' } } },
    }));
  });

  it('still rejects an outdated form without writing', async () => {
    await expect(updateCharacterDetails('character', {
      name: 'Test', shortName: 'Test', description: '', tags: [], perks: [],
    }, { expectedMembership: { perksIds: ['outdated'] }, apiKey: 'key' })).rejects.toBeInstanceOf(CharacterMembershipConflictError);
    expect(mocks.updateCharacter).not.toHaveBeenCalled();
  });
});
