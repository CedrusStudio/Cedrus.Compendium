import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { getStoredApiKey } from '@/lib/apiKeyStorage';
import { BestiaryColumnPreferenceKey, resolveBestiaryColumnVisibility } from '@/application/bestiary/bestiaryColumnPreferences';

const PERSONALIZATION_STORAGE_KEY = 'cedrus-personalization-profiles';
const PERSONALIZATION_EXPORT_FORMAT = 'cedrus-personalization-profile';
const PERSONALIZATION_EXPORT_VERSION = 1;
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

type QuickTagsByContext = Partial<Record<PersonalizationContext, string[]>>;
type QuickTagBucketKey = 'quickTagsByContext' | 'quickExcludeTagsByContext';

export type PersonalizationProfile = {
  userName?: string;
  bestiaryColumnVisibility?: Partial<Record<BestiaryColumnPreferenceKey, boolean>>;
  quickTagsByContext: QuickTagsByContext;
  quickExcludeTagsByContext: QuickTagsByContext;
  favoriteCharacterIds: string[];
  quickLinks: QuickLink[];
  mainCharacterId?: string;
};

export type PersonalizationProfileExport = {
  format: typeof PERSONALIZATION_EXPORT_FORMAT;
  version: typeof PERSONALIZATION_EXPORT_VERSION;
  profile: PersonalizationProfile;
};

export type PersonalizationSliceState = {
  profilesByApiKey: Record<string, PersonalizationProfile>;
  activeApiKey: string | null;
};

type QuickTagPayload = {
  context: PersonalizationContext;
  tag: string;
};

const personalizationProfileKeys = [
  'userName',
  'bestiaryColumnVisibility',
  'quickTagsByContext',
  'quickExcludeTagsByContext',
  'favoriteCharacterIds',
  'quickLinks',
  'mainCharacterId',
] as const;

const createEmptyProfile = (): PersonalizationProfile => ({
  userName: undefined,
  bestiaryColumnVisibility: undefined,
  quickTagsByContext: {},
  quickExcludeTagsByContext: {},
  favoriteCharacterIds: [],
  quickLinks: [],
  mainCharacterId: undefined,
});

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null;

const isQuickLinkRoute = (value: unknown): value is QuickLinkRoute => typeof value === 'string' && quickLinkRoutes.includes(value as QuickLinkRoute);

const hasRecognizedProfileProperty = (value: Record<string, unknown>) => personalizationProfileKeys.some(key => key in value);

const sanitizeQuickTagsByContext = (value: unknown): QuickTagsByContext => {
  if (!isRecord(value)) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(value)
      .filter(([context, tags]) => personalizationContexts.includes(context as PersonalizationContext) && Array.isArray(tags))
      .map(([context, tags]) => [context, (tags as unknown[]).filter((tag): tag is string => typeof tag === 'string').slice(0, MAX_QUICK_TAGS_PER_CONTEXT)]),
  ) as QuickTagsByContext;
};

const sanitizeProfile = (value: unknown): PersonalizationProfile => {
  if (!isRecord(value)) return createEmptyProfile();

  const quickTagsByContext = sanitizeQuickTagsByContext(value.quickTagsByContext);
  const quickExcludeTagsByContext = sanitizeQuickTagsByContext(value.quickExcludeTagsByContext);

  const favoriteCharacterIds = Array.isArray(value.favoriteCharacterIds)
    ? value.favoriteCharacterIds.filter((characterId): characterId is string => typeof characterId === 'string')
    : [];

  const quickLinks = Array.isArray(value.quickLinks)
    ? value.quickLinks.filter((quickLink): quickLink is QuickLink => {
        if (!isRecord(quickLink) || typeof quickLink.id !== 'string' || typeof quickLink.label !== 'string' || typeof quickLink.type !== 'string') {
          return false;
        }

        if (quickLink.type === 'route') {
          return isQuickLinkRoute(quickLink.href);
        }

        if (quickLink.type === 'character') {
          return typeof quickLink.characterId === 'string';
        }

        return false;
      })
    : [];

  const mainCharacterId = typeof value.mainCharacterId === 'string' && favoriteCharacterIds.includes(value.mainCharacterId)
    ? value.mainCharacterId
    : undefined;
  const userName = typeof value.userName === 'string' && value.userName.trim().length > 0 ? value.userName.trim() : undefined;
  const bestiaryColumnVisibility = isRecord(value.bestiaryColumnVisibility)
    ? resolveBestiaryColumnVisibility(value.bestiaryColumnVisibility as Partial<Record<BestiaryColumnPreferenceKey, boolean>>)
    : undefined;

  return {
    userName,
    bestiaryColumnVisibility,
    quickTagsByContext,
    quickExcludeTagsByContext,
    favoriteCharacterIds,
    quickLinks,
    mainCharacterId,
  };
};

const createPersonalizationProfileExport = (profile: PersonalizationProfile): PersonalizationProfileExport => ({
  format: PERSONALIZATION_EXPORT_FORMAT,
  version: PERSONALIZATION_EXPORT_VERSION,
  profile: sanitizeProfile(profile),
});

const parsePersonalizationProfileImport = (value: unknown): PersonalizationProfile | null => {
  if (!isRecord(value)) return null;

  if (
    value.format === PERSONALIZATION_EXPORT_FORMAT
    && value.version === PERSONALIZATION_EXPORT_VERSION
    && 'profile' in value
  ) {
    return sanitizeProfile(value.profile);
  }

  return hasRecognizedProfileProperty(value) ? sanitizeProfile(value) : null;
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

const getOppositeQuickTagBucketKey = (bucketKey: QuickTagBucketKey): QuickTagBucketKey => bucketKey === 'quickTagsByContext'
  ? 'quickExcludeTagsByContext'
  : 'quickTagsByContext';

const addQuickTagToBucket = (profile: PersonalizationProfile, payload: QuickTagPayload, bucketKey: QuickTagBucketKey) => {
  const tag = payload.tag.trim();
  if (!tag) return false;

  const existingTags = profile[bucketKey][payload.context] ?? [];
  const oppositeTags = profile[getOppositeQuickTagBucketKey(bucketKey)][payload.context] ?? [];
  if (existingTags.includes(tag) || oppositeTags.includes(tag) || existingTags.length >= MAX_QUICK_TAGS_PER_CONTEXT) {
    return false;
  }

  profile[bucketKey][payload.context] = [...existingTags, tag];
  return true;
};

const removeQuickTagFromBucket = (profile: PersonalizationProfile, payload: QuickTagPayload, bucketKey: QuickTagBucketKey) => {
  const existingTags = profile[bucketKey][payload.context] ?? [];
  profile[bucketKey][payload.context] = existingTags.filter(tag => tag !== payload.tag);
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

      if (!addQuickTagToBucket(profile, action.payload, 'quickTagsByContext')) return;

      persistProfiles(state);
    },
    addQuickExcludeTag(state, action: PayloadAction<QuickTagPayload>) {
      const profile = getActiveProfile(state);
      if (!profile) return;

      if (!addQuickTagToBucket(profile, action.payload, 'quickExcludeTagsByContext')) return;

      persistProfiles(state);
    },
    removeQuickTag(state, action: PayloadAction<QuickTagPayload>) {
      const profile = getActiveProfile(state);
      if (!profile) return;

      removeQuickTagFromBucket(profile, action.payload, 'quickTagsByContext');
      persistProfiles(state);
    },
    removeQuickExcludeTag(state, action: PayloadAction<QuickTagPayload>) {
      const profile = getActiveProfile(state);
      if (!profile) return;

      removeQuickTagFromBucket(profile, action.payload, 'quickExcludeTagsByContext');
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
    replaceProfile(state, action: PayloadAction<PersonalizationProfile>) {
      if (!state.activeApiKey) return;

      state.profilesByApiKey[state.activeApiKey] = sanitizeProfile(action.payload);
      persistProfiles(state);
    },
  },
});

export const { actions, reducer } = personalizationSlice;
export {
  PERSONALIZATION_EXPORT_VERSION,
  PERSONALIZATION_STORAGE_KEY,
  createEmptyProfile,
  createPersonalizationProfileExport,
  parsePersonalizationProfileImport,
  sanitizeProfile,
};