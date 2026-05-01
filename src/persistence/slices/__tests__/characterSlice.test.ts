import { describe, expect, it } from 'vitest';
import { actions, reducer } from '@/persistence/slices/characterSlice';

describe('characterSlice', () => {
  it('stores and clears the navbar search', () => {
    let state = reducer(undefined, { type: '@@INIT' });

    state = reducer(state, actions.setCharacterNavbarSearch('geralt'));
    expect(state.characterNavbarSearch).toBe('geralt');

    state = reducer(state, actions.clearCharacterNavbarSearch());
    expect(state.characterNavbarSearch).toBe('');
  });

  it('stores and clears short-name mappings', () => {
    let state = reducer(undefined, { type: '@@INIT' });

    state = reducer(state, actions.setCharacterShortName({ id: 'character-1', shortName: 'GRT' }));
    state = reducer(state, actions.setCharacterShortName({ id: 'character-2', shortName: 'YEN' }));

    expect(state.characterShortNameMapping).toEqual({
      'character-1': 'GRT',
      'character-2': 'YEN',
    });

    state = reducer(state, actions.clearCharacterShortName());
    expect(state.characterShortNameMapping).toEqual({});
  });
});