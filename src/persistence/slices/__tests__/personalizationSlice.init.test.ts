import { beforeEach, describe, expect, it, vi } from 'vitest';
import { defaultBestiaryColumnVisibility } from '@/application/bestiary/bestiaryColumnPreferences';

const STORAGE_KEY = 'cedrus-personalization-profiles';

const importPersonalizationSlice = async (storedApiKey: string | null = 'alpha') => {
  vi.resetModules();
  vi.doMock('@/common/hooks/useApiKey', () => ({
    getStoredApiKey: () => storedApiKey,
  }));

  return import('@/persistence/slices/personalizationSlice');
};

describe('personalizationSlice initialization', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('loads and sanitizes persisted profiles from localStorage', async () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        alpha: {
          userName: '  Marek  ',
          bestiaryColumnVisibility: { powers: true },
          quickTagsByContext: {
            perks: ['tag-1', 2, 'tag-2', 'tag-3', 'tag-4', 'tag-5', 'tag-6'],
            invalid: ['ignored'],
          },
          favoriteCharacterIds: ['character-1', 2],
          quickLinks: [
            { id: 'route-link', label: 'Favorites', type: 'route', href: '/characters/favorites' },
            { id: 'character-link', label: 'Hero', type: 'character', characterId: 'character-1' },
            { id: 1, label: 'invalid-id', type: 'route', href: '/characters' },
            { id: 'missing-href', label: 'invalid-route', type: 'route' },
            { id: 'invalid-type', label: 'invalid-type', type: 'unknown' },
          ],
          mainCharacterId: 'character-1',
        },
        beta: null,
      }),
    );

    const module = await importPersonalizationSlice('alpha');
    const state = module.reducer(undefined, { type: '@@INIT' });

    expect(state.activeApiKey).toBe('alpha');
    expect(state.profilesByApiKey.alpha).toEqual({
      userName: 'Marek',
      bestiaryColumnVisibility: {
        ...defaultBestiaryColumnVisibility,
        powers: true,
      },
      quickTagsByContext: {
        perks: ['tag-1', 'tag-2', 'tag-3', 'tag-4', 'tag-5'],
      },
      favoriteCharacterIds: ['character-1'],
      quickLinks: [
        { id: 'route-link', label: 'Favorites', type: 'route', href: '/characters/favorites' },
        { id: 'character-link', label: 'Hero', type: 'character', characterId: 'character-1' },
      ],
      mainCharacterId: 'character-1',
    });
    expect(state.profilesByApiKey.beta).toEqual(module.createEmptyProfile());
  });

  it('falls back to empty profiles when persisted JSON is invalid', async () => {
    localStorage.setItem(STORAGE_KEY, '{invalid-json');

    const module = await importPersonalizationSlice(null);
    const state = module.reducer(undefined, { type: '@@INIT' });

    expect(state.profilesByApiKey).toEqual({});
    expect(state.activeApiKey).toBeNull();
  });
});