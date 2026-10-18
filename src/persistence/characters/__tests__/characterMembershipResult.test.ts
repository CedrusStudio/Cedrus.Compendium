import { describe, expect, it } from 'vitest';
import { applyMembershipResult } from '../characterMembershipResult';
import type { CharacterWithRelations } from '@/persistence/mappings/characterMapping';

describe('confirmed membership response cache merge', () => {
  const original = { id: 'a', description: 'Original', maneuvers: [], maneuversIds: [], perks: [{ id: 'old' }], perksIds: ['old'] } as unknown as CharacterWithRelations;
  it('updates only the confirmed relation and its snapshot, preserving all other form preconditions', () => {
    const result = applyMembershipResult(original, { characterId: 'a', kind: 'maneuvers', entityId: 'new', present: true, changed: true,
      characterPatch: { maneuvers: [{ id: 'new' }] as never, maneuversIds: ['new'], perksIds: ['external'] } });
    expect(result).toMatchObject({ maneuversIds: ['new'], perksIds: ['old'], description: 'Original' });
    expect(original.maneuversIds).toEqual([]);
  });
  it('does not apply another character or incomplete/old server responses', () => {
    const result = { characterId: 'b', kind: 'maneuvers' as const, entityId: 'new', present: true, changed: true };
    expect(applyMembershipResult(original, result)).toBeUndefined();
    expect(applyMembershipResult(original, { ...result, characterId: 'a', characterPatch: { maneuversIds: ['new'] } })).toBeUndefined();
  });
});
