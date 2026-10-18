import { beforeEach, describe, expect, it, vi } from 'vitest';
vi.mock('@/lib/env', () => ({ adminApiKeys: ['valid'] }));
vi.mock('@/persistence/characters/characterMembershipRepository', () => ({ setCharacterMembership: vi.fn() }));
import { setCharacterMembership } from '@/persistence/characters/characterMembershipRepository';
import { CharacterMembershipError } from '@/persistence/characters/characterMembershipErrors';
import { characterMembershipSchema } from '@/persistence/schemas/characters/characterMembershipSchema';
import { PUT } from './route';

const repository = vi.mocked(setCharacterMembership);
const params = (kind = 'maneuvers') => ({ params: Promise.resolve({ id: 'character', kind, entityId: 'entry' }) });
function request(body: unknown = { present: true }, key: string | null = 'valid') {
  return new Request('http://localhost/api/characters/character/compendium-memberships/maneuvers/entry', {
    method: 'PUT', headers: { 'Content-Type': 'application/json', ...(key ? { 'x-api-key': key } : {}) }, body: JSON.stringify(body),
  });
}
describe('PUT character compendium membership', () => {
  beforeEach(() => { repository.mockReset(); });
  it.each([[null, 401], ['wrong', 403]] as const)('rejects missing or invalid key %s', async (key, status) => {
    expect((await PUT(request({ present: true }, key), params())).status).toBe(status);
    expect(repository).not.toHaveBeenCalled();
  });
  it.each(['maneuvers','perks','stances','states'])('saves a desired state for %s without accepting entity edits', async kind => {
    repository.mockResolvedValue({ characterId: 'character', kind: kind as 'maneuvers', entityId: 'entry', present: true, changed: true });
    const response = await PUT(request(), params(kind));
    expect(response.status).toBe(200);
    expect(repository).toHaveBeenCalledWith('character', kind, 'entry', true, 'valid');
  });
  it.each([{}, { present: 'true' }, { present: true, name: 'Changed' }, { toggle: true }])('rejects an invalid/over-specified body', async body => {
    expect((await PUT(request(body), params())).status).toBe(400);
    expect(repository).not.toHaveBeenCalled();
  });
  it('rejects unsupported categories and malformed JSON', async () => {
    expect((await PUT(request(), params('spells'))).status).toBe(400);
    const malformed = new Request('http://localhost/api/x', { method: 'PUT', headers: { 'x-api-key': 'valid' }, body: '{' });
    expect((await PUT(malformed, params())).status).toBe(400);
    expect(repository).not.toHaveBeenCalled();
  });
  it.each([404,409,422])('preserves expected HTTP error %s', async status => {
    repository.mockRejectedValue(new CharacterMembershipError(status, 'Expected'));
    const response = await PUT(request(), params());
    expect(response.status).toBe(status);
    expect((await response.json()).message).toBe('Expected');
  });
  it('returns a real HTTP 500 without disclosing internal error details', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    repository.mockRejectedValue(new Error('Internal database credentials'));
    const response = await PUT(request(), params());
    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ message: 'Server error' });
  });
  it('accepts both desired states, not a toggle operation', () => {
    expect(characterMembershipSchema.parse({ present: false })).toEqual({ present: false });
  });
});
