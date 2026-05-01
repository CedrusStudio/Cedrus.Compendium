import { beforeEach, describe, expect, it, vi } from 'vitest';
import { defaultBestiaryColumnVisibility } from '@/application/bestiary/bestiaryColumnPreferences';

vi.mock('@/common/hooks/useApiKey', () => ({
  getStoredApiKey: () => 'alpha',
}));

import { actions, createEmptyProfile, PERSONALIZATION_STORAGE_KEY, reducer, MAX_QUICK_TAGS_PER_CONTEXT, PersonalizationSliceState } from '@/persistence/slices/personalizationSlice';

describe('personalizationSlice', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  const createState = (overrides?: Partial<PersonalizationSliceState>): PersonalizationSliceState => ({
    activeApiKey: 'alpha',
    profilesByApiKey: {
      alpha: createEmptyProfile(),
      ...(overrides?.profilesByApiKey ?? {}),
    },
    ...overrides,
  });

  it('keeps profiles isolated per API key', () => {
    let state = createState();

    state = reducer(state, actions.addFavoriteCharacter('character-1'));
    state = reducer(state, actions.setActiveApiKey('beta'));
    state = reducer(state, actions.addFavoriteCharacter('character-2'));

    expect(state.profilesByApiKey.alpha.favoriteCharacterIds).toEqual(['character-1']);
    expect(state.profilesByApiKey.beta.favoriteCharacterIds).toEqual(['character-2']);
  });

  it('enforces the quick-tag limit per context', () => {
    let state = createState();

    for (let index = 0; index < MAX_QUICK_TAGS_PER_CONTEXT + 2; index += 1) {
      state = reducer(state, actions.addQuickTag({ context: 'perks', tag: `tag-${index}` }));
    }

    expect(state.profilesByApiKey.alpha.quickTagsByContext.perks).toEqual([
      'tag-0',
      'tag-1',
      'tag-2',
      'tag-3',
      'tag-4',
    ]);
  });

  it('clears the main character when that favorite is removed', () => {
    let state = createState();

    state = reducer(state, actions.addFavoriteCharacter('character-1'));
    state = reducer(state, actions.setMainCharacter('character-1'));
    state = reducer(state, actions.removeFavoriteCharacter('character-1'));

    expect(state.profilesByApiKey.alpha.favoriteCharacterIds).toEqual([]);
    expect(state.profilesByApiKey.alpha.mainCharacterId).toBeUndefined();
  });

  it('persists quick links to localStorage', () => {
    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem');
    let state = createState();

    state = reducer(state, actions.addQuickLink({
      id: 'favorites',
      label: 'Ulubione',
      type: 'route',
      href: '/characters/favorites',
    }));

    expect(state.profilesByApiKey.alpha.quickLinks).toEqual([
      {
        id: 'favorites',
        label: 'Ulubione',
        type: 'route',
        href: '/characters/favorites',
      },
    ]);
    expect(setItemSpy).toHaveBeenCalledWith(
      PERSONALIZATION_STORAGE_KEY,
      JSON.stringify(state.profilesByApiKey),
    );
  });

  it('ignores mutations when no active API key is set', () => {
    let state = createState({ activeApiKey: null, profilesByApiKey: {} });

    state = reducer(state, actions.addFavoriteCharacter('character-1'));

    expect(state.profilesByApiKey).toEqual({});
  });

  it('stores a user name per API key profile and persists it', () => {
    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem');
    let state = createState();

    state = reducer(state, actions.setUserName('Marek'));
    state = reducer(state, actions.setActiveApiKey('beta'));
    state = reducer(state, actions.setUserName('Anna'));

    expect(state.profilesByApiKey.alpha.userName).toBe('Marek');
    expect(state.profilesByApiKey.beta.userName).toBe('Anna');
    expect(setItemSpy).toHaveBeenCalledWith(
      PERSONALIZATION_STORAGE_KEY,
      JSON.stringify(state.profilesByApiKey),
    );
  });

  it('clears the stored user name when set to an empty value', () => {
    let state = createState({
      profilesByApiKey: {
        alpha: {
          ...createEmptyProfile(),
          userName: 'Marek',
        },
      },
    });

    state = reducer(state, actions.setUserName('   '));

    expect(state.profilesByApiKey.alpha.userName).toBeUndefined();
  });

  it('stores a bestiary column preference per API key profile', () => {
    let state = createState();

    state = reducer(state, actions.setBestiaryColumnVisibility({ powers: true, tags: true }));
    state = reducer(state, actions.setActiveApiKey('beta'));
    state = reducer(state, actions.setBestiaryColumnVisibility({ initiative: false }));

    expect(state.profilesByApiKey.alpha.bestiaryColumnVisibility).toEqual({
      ...defaultBestiaryColumnVisibility,
      powers: true,
      tags: true,
    });
    expect(state.profilesByApiKey.beta.bestiaryColumnVisibility).toEqual({
      ...defaultBestiaryColumnVisibility,
      initiative: false,
    });
  });

  it('clears the saved bestiary column preference', () => {
    let state = createState();

    state = reducer(state, actions.setBestiaryColumnVisibility({ powers: true }));
    state = reducer(state, actions.clearBestiaryColumnVisibility());

    expect(state.profilesByApiKey.alpha.bestiaryColumnVisibility).toBeUndefined();
  });
});