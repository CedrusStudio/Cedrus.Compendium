import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { getStoredApiKey } from '@/common/hooks/useApiKey';
import { BestiaryColumnPreferenceKey, resolveBestiaryColumnVisibility } from '@/application/bestiary/bestiaryColumnPreferences';

const PERSONALIZATION_STORAGE_KEY = 'cedrus-personalization-profiles';
export const MAX_QUICK_TAGS_PER_CONTEXT = 5;

export const personalizationContexts = [
  'characters',
  'bestiary',
  'maneuvers',
  'stances',
  'states',
  'perks',
  'powers',
  'spells',
  'races',
  'weapons',
  'armors',
  'shields',
  'inventory',
  'mounts',
] as const;

export const quickLinkRoutes = [
  '/characters',
  '/characters/favorites',
  '/bestiary',
  '/compendium',
  '/compendium/maneuvers',
  '/compendium/stances',
  '/compendium/states',
  '/compendium/perks',
  '/compendium/powers',
  '/compendium/spells',
  '/compendium/races',
  '/compendium/equipment',
  '/compendium/equipment/weapons',
  '/compendium/equipment/armors',
  '/compendium/equipment/shields',
  '/compendium/equipment/inventory',
  '/compendium/equipment/mounts',
] as const;

export type PersonalizationContext = typeof personalizationContexts[number];
export type QuickLinkRoute = typeof quickLinkRoutes[number];

export type QuickLink =
  | {
      id: string;
      label: string;
      type: 'route';
      href: QuickLinkRoute;
    }
  | {
      id: string;
      label: string;
      type: 'character';
      characterId: string;
    };

export type PersonalizationProfile = {
  userName?: string;
  bestiaryColumnVisibility?: Partial<Record<BestiaryColumnPreferenceKey, boolean>>;
  quickTagsByContext: Partial<Record<PersonalizationContext, string[]>>;
  favoriteCharacterIds: string[];
  quickLinks: QuickLink[];
  mainCharacterId?: string;
};

export type PersonalizationSliceState = {
  profilesByApiKey: Record<string, PersonalizationProfile>;
  activeApiKey: string | null;
};

type QuickTagPayload = {
  context: PersonalizationContext;
  tag: string;
};

const createEmptyProfile = (): PersonalizationProfile => ({
  userName: undefined,
  bestiaryColumnVisibility: undefined,
  quickTagsByContext: {},
  favoriteCharacterIds: [],
  quickLinks: [],
  mainCharacterId: undefined,
});

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null;

const sanitizeProfile = (value: unknown): PersonalizationProfile => {
  if (!isRecord(value)) return createEmptyProfile();

  const quickTagsByContext = isRecord(value.quickTagsByContext)
    ? Object.fromEntries(
        Object.entries(value.quickTagsByContext)
          .filter(([context, tags]) => personalizationContexts.includes(context as PersonalizationContext) && Array.isArray(tags))
          .map(([context, tags]) => [context, (tags as unknown[]).filter((tag): tag is string => typeof tag === 'string').slice(0, MAX_QUICK_TAGS_PER_CONTEXT)]),
      ) as Partial<Record<PersonalizationContext, string[]>>
    : {};

  const favoriteCharacterIds = Array.isArray(value.favoriteCharacterIds)
    ? value.favoriteCharacterIds.filter((characterId): characterId is string => typeof characterId === 'string')
    : [];

  const quickLinks = Array.isArray(value.quickLinks)
    ? value.quickLinks.filter((quickLink): quickLink is QuickLink => {
        if (!isRecord(quickLink) || typeof quickLink.id !== 'string' || typeof quickLink.label !== 'string' || typeof quickLink.type !== 'string') {
          return false;
        }

        if (quickLink.type === 'route') {
          return typeof quickLink.href === 'string';
        }

        if (quickLink.type === 'character') {
          return typeof quickLink.characterId === 'string';
        }

        return false;
      })
    : [];

  const mainCharacterId = typeof value.mainCharacterId === 'string' ? value.mainCharacterId : undefined;
  const userName = typeof value.userName === 'string' && value.userName.trim().length > 0 ? value.userName.trim() : undefined;
  const bestiaryColumnVisibility = isRecord(value.bestiaryColumnVisibility)
    ? resolveBestiaryColumnVisibility(value.bestiaryColumnVisibility as Partial<Record<BestiaryColumnPreferenceKey, boolean>>)
    : undefined;

  return {
    userName,
    bestiaryColumnVisibility,
    quickTagsByContext,
    favoriteCharacterIds,
    quickLinks,
    mainCharacterId,
  };
};

const loadProfilesFromLocalStorage = (): Record<string, PersonalizationProfile> => {
  if (typeof window === 'undefined') return {};

  const stored = localStorage.getItem(PERSONALIZATION_STORAGE_KEY);
  if (!stored) return {};

  try {
    const parsed = JSON.parse(stored);

    if (!isRecord(parsed)) return {};

    return Object.fromEntries(
      Object.entries(parsed)
        .filter(([apiKey]) => typeof apiKey === 'string' && apiKey.length > 0)
        .map(([apiKey, profile]) => [apiKey, sanitizeProfile(profile)]),
    );
  } catch {
    return {};
  }
};

const saveProfilesToLocalStorage = (profilesByApiKey: Record<string, PersonalizationProfile>) => {
  if (typeof window === 'undefined') return;

  localStorage.setItem(PERSONALIZATION_STORAGE_KEY, JSON.stringify(profilesByApiKey));
};

const getActiveProfile = (state: PersonalizationSliceState) => {
  if (!state.activeApiKey) return null;

  if (!state.profilesByApiKey[state.activeApiKey]) {
    state.profilesByApiKey[state.activeApiKey] = createEmptyProfile();
  }

  return state.profilesByApiKey[state.activeApiKey];
};

const persistProfiles = (state: PersonalizationSliceState) => {
  saveProfilesToLocalStorage(state.profilesByApiKey);
};

const initialState: PersonalizationSliceState = {
  profilesByApiKey: loadProfilesFromLocalStorage(),
  activeApiKey: getStoredApiKey(),
};

const personalizationSlice = createSlice({
  name: 'personalization',
  initialState,
  reducers: {
    setActiveApiKey(state, action: PayloadAction<string | null>) {
      state.activeApiKey = action.payload?.trim() || null;

      if (state.activeApiKey && !state.profilesByApiKey[state.activeApiKey]) {
        state.profilesByApiKey[state.activeApiKey] = createEmptyProfile();
        persistProfiles(state);
      }
    },
    setUserName(state, action: PayloadAction<string | undefined>) {
      const profile = getActiveProfile(state);
      if (!profile) return;

      profile.userName = action.payload?.trim() || undefined;
      persistProfiles(state);
    },
    setBestiaryColumnVisibility(state, action: PayloadAction<Partial<Record<BestiaryColumnPreferenceKey, boolean>>>) {
      const profile = getActiveProfile(state);
      if (!profile) return;

      profile.bestiaryColumnVisibility = resolveBestiaryColumnVisibility(action.payload);
      persistProfiles(state);
    },
    clearBestiaryColumnVisibility(state) {
      const profile = getActiveProfile(state);
      if (!profile) return;

      profile.bestiaryColumnVisibility = undefined;
      persistProfiles(state);
    },
    addQuickTag(state, action: PayloadAction<QuickTagPayload>) {
      const profile = getActiveProfile(state);
      if (!profile) return;

      const tag = action.payload.tag.trim();
      if (!tag) return;

      const existingTags = profile.quickTagsByContext[action.payload.context] ?? [];
      if (existingTags.includes(tag) || existingTags.length >= MAX_QUICK_TAGS_PER_CONTEXT) return;

      profile.quickTagsByContext[action.payload.context] = [...existingTags, tag];
      persistProfiles(state);
    },
    removeQuickTag(state, action: PayloadAction<QuickTagPayload>) {
      const profile = getActiveProfile(state);
      if (!profile) return;

      const existingTags = profile.quickTagsByContext[action.payload.context] ?? [];
      profile.quickTagsByContext[action.payload.context] = existingTags.filter(tag => tag !== action.payload.tag);
      persistProfiles(state);
    },
    addFavoriteCharacter(state, action: PayloadAction<string>) {
      const profile = getActiveProfile(state);
      if (!profile) return;

      if (!profile.favoriteCharacterIds.includes(action.payload)) {
        profile.favoriteCharacterIds.push(action.payload);
        persistProfiles(state);
      }
    },
    removeFavoriteCharacter(state, action: PayloadAction<string>) {
      const profile = getActiveProfile(state);
      if (!profile) return;

      profile.favoriteCharacterIds = profile.favoriteCharacterIds.filter(characterId => characterId !== action.payload);

      if (profile.mainCharacterId === action.payload) {
        profile.mainCharacterId = undefined;
      }

      persistProfiles(state);
    },
    toggleFavoriteCharacter(state, action: PayloadAction<string>) {
      const profile = getActiveProfile(state);
      if (!profile) return;

      if (profile.favoriteCharacterIds.includes(action.payload)) {
        profile.favoriteCharacterIds = profile.favoriteCharacterIds.filter(characterId => characterId !== action.payload);
        if (profile.mainCharacterId === action.payload) {
          profile.mainCharacterId = undefined;
        }
      } else {
        profile.favoriteCharacterIds.push(action.payload);
      }

      persistProfiles(state);
    },
    setMainCharacter(state, action: PayloadAction<string | undefined>) {
      const profile = getActiveProfile(state);
      if (!profile) return;

      if (action.payload && !profile.favoriteCharacterIds.includes(action.payload)) {
        return;
      }

      profile.mainCharacterId = action.payload;
      persistProfiles(state);
    },
    addQuickLink(state, action: PayloadAction<QuickLink>) {
      const profile = getActiveProfile(state);
      if (!profile) return;

      profile.quickLinks.push(action.payload);
      persistProfiles(state);
    },
    removeQuickLink(state, action: PayloadAction<string>) {
      const profile = getActiveProfile(state);
      if (!profile) return;

      profile.quickLinks = profile.quickLinks.filter(quickLink => quickLink.id !== action.payload);
      persistProfiles(state);
    },
    updateQuickLink(state, action: PayloadAction<QuickLink>) {
      const profile = getActiveProfile(state);
      if (!profile) return;

      const index = profile.quickLinks.findIndex(quickLink => quickLink.id === action.payload.id);
      if (index === -1) return;

      profile.quickLinks[index] = action.payload;
      persistProfiles(state);
    },
  },
});

export const { actions, reducer } = personalizationSlice;
export { PERSONALIZATION_STORAGE_KEY, createEmptyProfile };