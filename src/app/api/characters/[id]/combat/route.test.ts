import { beforeEach, describe, expect, it, vi } from 'vitest';
vi.mock('@/lib/env', () => ({ adminApiKeys: ['valid'] }));
vi.mock('@/persistence/characters/charactersRepository', () => ({ updateCharacterCombat: vi.fn() }));
import { updateCharacterCombat } from '@/persistence/characters/charactersRepository';
import { CharacterMembershipConflictError } from '@/persistence/characters/characterMembershipErrors';
import { PUT } from './route';

const repository = vi.mocked(updateCharacterCombat);
const expectedMembership = { maneuversIds: [], stancesIds: [], statesIds: [], spellsIds: [], powerSpecificationsIds: [] };
const payload = {
  health: { barrier: 0, vitality: 10, toughness: 0, recoveryLevel: 1, lethalHealth: 0, lethalRounds: 0, bonus: 0 },
  offenses: [], defenses: [], maneuvers: [], stances: [], states: [], powers: [], expectedMembership,
};
const segment = { params: Promise.resolve({ id: 'character' }) };
function request(body: unknown, key: string | null = 'valid') {
  return new Request('http://localhost/api/characters/character/combat', { method: 'PUT', headers: { 'Content-Type': 'application/json', ...(key ? { 'x-api-key': key } : {}) }, body: JSON.stringify(body) });
}
describe('guarded combat route', () => {
  beforeEach(() => { repository.mockReset(); });
  it('requires both a valid key and an original snapshot', async () => {
    expect((await PUT(request(payload, null), segment)).status).toBe(401);
    expect((await PUT(request({ ...payload, expectedMembership: undefined }), segment)).status).toBe(400);
    expect(repository).not.toHaveBeenCalled();
  });
  it('passes the snapshot to the write and returns the updated snapshot', async () => {
    const result = { ...expectedMembership, perksIds: [] };
    repository.mockResolvedValue(result);
    const response = await PUT(request(payload), segment);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ expectedMembership: result });
    expect(repository).toHaveBeenCalledWith('character', expect.objectContaining({ maneuvers: [] }), { expectedMembership, apiKey: 'valid' });
  });
  it('returns an actual HTTP 409 for a stale draft', async () => {
    repository.mockRejectedValue(new CharacterMembershipConflictError());
    expect((await PUT(request(payload), segment)).status).toBe(409);
  });
});
