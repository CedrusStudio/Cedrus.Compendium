import { beforeEach, describe, expect, it, vi } from 'vitest';
vi.mock('@/lib/env', () => ({ adminApiKeys: ['valid'] }));
vi.mock('@/persistence/characters/charactersRepository', () => ({ updateCharacterDetails: vi.fn(), updateCharacterCombat: vi.fn() }));
import { updateCharacterDetails } from '@/persistence/characters/charactersRepository';
import { CharacterValidationError } from '@/persistence/characters/characterErrors';
import { CharacterMembershipConflictError } from '@/persistence/characters/characterMembershipErrors';
import { PUT } from './route';

const repository = vi.mocked(updateCharacterDetails);
const payload = { name: 'Geralt', shortName: 'Ger', description: 'White Wolf', tags: [], perks: [], expectedMembership: { perksIds: [] } };
function request(body: unknown = payload, key: string | null = 'valid') {
 return new Request('http://localhost/api/characters/character/details', { method: 'PUT', headers: { 'Content-Type': 'application/json', ...(key ? { 'x-api-key': key } : {}) }, body: JSON.stringify(body) });
}
const segment = (id = 'character') => ({ params: Promise.resolve({ id }) });
describe('guarded character details route', () => {
 beforeEach(() => { repository.mockReset(); });
 it('validates both key and payload before calling persistence', async () => {
  expect((await PUT(request(payload,null),segment())).status).toBe(401);
  expect((await PUT(request(payload,'bad'),segment())).status).toBe(403);
  expect((await PUT(request(),segment(''))).status).toBe(400);
  expect((await PUT(request({ ...payload, expectedMembership: undefined }),segment())).status).toBe(400);
  expect(repository).not.toHaveBeenCalled();
 });
 it('passes the original snapshot and validated key to persistence', async () => {
  const snapshot = { perksIds: ['new'], maneuversIds: [], stancesIds: [], statesIds: [], spellsIds: [], powerSpecificationsIds: [] };
  repository.mockResolvedValue(snapshot);
  const response = await PUT(request(),segment());
  expect(response.status).toBe(200);
  expect(await response.json()).toEqual({ expectedMembership: snapshot });
  expect(repository).toHaveBeenCalledWith('character', expect.objectContaining({ name: 'Geralt' }), { expectedMembership: { perksIds: [] }, apiKey: 'valid' });
 });
 it('returns 404 for a missing character', async () => {
  repository.mockResolvedValue(false);
  expect((await PUT(request(),segment())).status).toBe(404);
 });
 it('reports stale drafts as conflicts, not success', async () => {
  repository.mockRejectedValue(new CharacterMembershipConflictError());
  expect((await PUT(request(),segment())).status).toBe(409);
 });
 it('preserves useful validation messages', async () => {
  repository.mockRejectedValue(new CharacterValidationError('Invalid API keys'));
  const response = await PUT(request(),segment());
  expect(response.status).toBe(400);
  expect((await response.json()).message).toBe('Invalid API keys');
 });
 it('does not expose internal failures', async () => {
  vi.spyOn(console,'error').mockImplementation(() => {});
  repository.mockRejectedValue(new Error('Internal'));
  const response = await PUT(request(),segment());
  expect(response.status).toBe(500);
  expect(await response.json()).toEqual({message:'Server error'});
 });
});
