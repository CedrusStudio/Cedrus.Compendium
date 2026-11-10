import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createDuplicatedCharacter, createExternalParticipant } from '@/application/bestiary/battle/BattleCombatants';
import { CreateEmptyCharacter } from '@/domain/characters/Character';

beforeEach(() => {
  sessionStorage.clear();
  vi.resetModules();
});

async function loadBattle()
{
  const { actions, reducer } = await import('../bestiarySlice');
  const state = reducer(undefined, { type: 'test/initial' });
  return { actions, reducer, state };
}

describe('bestiary battle session', () => {
  it('restores a mixed roster, initiatives and the preset identifier after reload', async () => {
    const { actions, reducer, state } = await loadBattle();
    const external = createExternalParticipant('Ally', 25, 3, 2);
    const source = CreateEmptyCharacter({ name: 'Aldara', shortName: 'Aldara', tags: [], description: '' });
    const duplicate = createDuplicatedCharacter(source, []);
    const withCharacters = reducer(state, actions.addSelectedToBattle(['a', 'b', 'a']));
    const withAlly = reducer(withCharacters, actions.addExternalParticipant(external));
    const withDuplicate = reducer(withAlly, actions.addDuplicatedCharacter(duplicate));
    const withPreset = reducer(withDuplicate, actions.setLoadedPresetId('preset-1'));
    const withRoll = reducer(withPreset, actions.rollInitiativeForCharacter({ characterId: 'a', rollResult: 12 }));
    const saved = reducer(withRoll, actions.setInitiative({ characterId: external.id, initiative: 8 }));

    vi.resetModules();
    const reopened = await loadBattle();
    expect(reopened.state).toEqual(saved);
    expect(reopened.state.addedToBattle).toEqual(['a', 'b']);
    expect(reopened.state.loadedPresetId).toBe('preset-1');
  });

  it('edits an external participant and removes initiative entries only for removed participants', async () => {
    const { actions, reducer, state } = await loadBattle();
    const external = { ...createExternalParticipant('Ally'), id: 'ally' };
    const source = CreateEmptyCharacter({ name: 'Aldara', shortName: 'Aldara', tags: [], description: '' });
    const duplicate = { ...createDuplicatedCharacter(source, []), id: 'dup_a' };
    let current = reducer(state, actions.addSelectedToBattle(['a', 'b']));
    current = reducer(current, actions.addExternalParticipant(external));
    current = reducer(current, actions.addDuplicatedCharacter(duplicate));
    current = reducer(current, actions.updateExternalParticipant({ ...external, maxHealth: 30 }));
    expect(current.externalParticipants[0]?.maxHealth).toBe(30);
    expect(reducer(current, actions.updateExternalParticipant({ ...external, id: 'missing' }))).toEqual(current);

    for (const [characterId, rollResult] of [['a', 1], ['b', 2], ['ally', 3], ['dup_a', 4]] as const) {
      current = reducer(current, actions.rollInitiativeForCharacter({ characterId, rollResult }));
    }
    current = reducer(current, actions.removeSelectedFromBattle(['a']));
    current = reducer(current, actions.removeDuplicatedCharacter('dup_a'));
    current = reducer(current, actions.removeExternalParticipant('ally'));
    expect(current.addedToBattle).toEqual(['b']);
    expect(current.externalParticipants).toEqual([]);
    expect(current.duplicatedCharacters).toEqual([]);
    expect(current.initiatives).toEqual({ b: { initiative: 2 } });
  });

  it('keeps a valid preset when storage fields are damaged and clears it on a new battle', async () => {
    sessionStorage.setItem('charactersInBattle', '{"invalid":true}');
    sessionStorage.setItem('battleInitiatives', 'null');
    sessionStorage.setItem('externalParticipants', '{');
    sessionStorage.setItem('duplicatedCharacters', '{');
    sessionStorage.setItem('loadedBattlePresetId', 'retained');
    const { actions, reducer, state } = await loadBattle();
    expect(state).toEqual({
      addedToBattle: [], initiatives: {}, externalParticipants: [], duplicatedCharacters: [], loadedPresetId: 'retained',
    });

    const cleared = reducer(state, actions.clearBattle());
    vi.resetModules();
    expect((await loadBattle()).state).toEqual(cleared);
    expect(cleared.loadedPresetId).toBeNull();
  });
});
