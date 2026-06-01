import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { getStoredApiKey } from '@/lib/apiKeyStorage';
import { type BestiaryColumnPreferenceKey, resolveBestiaryColumnVisibility } from '@/application/bestiary/bestiaryColumnPreferences';
import {
  MAX_QUICK_TAGS_PER_CONTEXT,
  createEmptyProfile,
  sanitizeProfile,
  type PersonalizationContext,
  type PersonalizationProfile,
  type QuickLink,
} from '@/common/personalization/personalizationProfile';

const PERSONALIZATION_STORAGE_KEY = 'cedrus-personalization-profiles';
type QuickTagBucketKey = 'quickTagsByContext' | 'quickExcludeTagsByContext';

export type PersonalizationSliceState = {
  profilesByApiKey: Record<string, PersonalizationProfile>;
  activeApiKey: string | null;
};

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null;

type QuickTagPayload = {
  context: PersonalizationContext;
  tag: string;
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
export { PERSONALIZATION_STORAGE_KEY };
export {
  MAX_QUICK_TAGS_PER_CONTEXT,
  createEmptyProfile,
  personalizationContexts,
  quickLinkRoutes,
  sanitizeProfile,
} from '@/common/personalization/personalizationProfile';
export type {
  PersonalizationContext,
  PersonalizationProfile,
  QuickLink,
  QuickLinkRoute,
} from '@/common/personalization/personalizationProfile';