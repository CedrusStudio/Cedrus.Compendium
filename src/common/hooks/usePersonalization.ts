"use client";

import { useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useApiKey } from '@/common/hooks/useApiKey';
import { createEmptyProfile, type PersonalizationContext, type PersonalizationProfile, type QuickLink } from '@/common/personalization/personalizationProfile';
import personalizationClient from '@/infrastructure/clients/personalizationClient';
import { AppDispatch, RootState } from '@/persistence/slices/store';
import { actions } from '@/persistence/slices/personalizationSlice';
import { BestiaryColumnPreferenceKey } from '@/application/bestiary/bestiaryColumnPreferences';

const EMPTY_PROFILE_JSON = JSON.stringify(createEmptyProfile());

function serializeProfile(profile: PersonalizationProfile)
{
  return JSON.stringify(profile);
}

export function usePersonalization()
{
  const dispatch = useDispatch<AppDispatch>();
  const { apiKey, hasApiKey, isLoaded } = useApiKey();
  const storedProfile = useSelector((state: RootState) => (apiKey ? state.personalization.profilesByApiKey[apiKey] : undefined));
  const [isRemoteProfileReady, setIsRemoteProfileReady] = useState(false);
  const [isSavingToDatabase, setIsSavingToDatabase] = useState(false);

  useEffect(() => 
  {
    dispatch(actions.setActiveApiKey(apiKey));
  }, [apiKey, dispatch]);

  const profile = useMemo(() => storedProfile ?? createEmptyProfile(), [storedProfile]);
  const serializedProfile = useMemo(() => serializeProfile(profile), [profile]);
  const serializedProfileRef = useRef(serializedProfile);
  const lastPersistedProfileRef = useRef<string | null>(null);

  useEffect(() =>
  {
    serializedProfileRef.current = serializedProfile;
  }, [serializedProfile]);

  const persistProfileToDatabase = async (
    profileToSave: PersonalizationProfile,
    serializedProfileToSave: string,
  ) =>
  {
    setIsSavingToDatabase(true);

    try {
      const savedProfile = await personalizationClient.saveProfile(profileToSave);
      const savedProfileJson = serializeProfile(savedProfile);

      lastPersistedProfileRef.current = savedProfileJson;

      if (savedProfileJson !== serializedProfileToSave) {
        dispatch(actions.replaceProfile(savedProfile));
      }

      return savedProfile;
    } catch (error) {
      lastPersistedProfileRef.current = null;
      throw error;
    } finally {
      setIsSavingToDatabase(false);
    }
  };

  useEffect(() =>
  {
    if (!isLoaded) {
      setIsRemoteProfileReady(false);
      return;
    }

    lastPersistedProfileRef.current = null;

    if (!apiKey) {
      lastPersistedProfileRef.current = serializedProfileRef.current;
      setIsRemoteProfileReady(true);
      return;
    }

    let isActive = true;
    const fallbackProfileJson = serializedProfileRef.current;

    setIsRemoteProfileReady(false);

    void personalizationClient.getProfile()
      .then((remoteProfile) =>
      {
        if (!isActive) {
          return;
        }

        if (remoteProfile) {
          const remoteProfileJson = serializeProfile(remoteProfile);

          lastPersistedProfileRef.current = remoteProfileJson;
          dispatch(actions.replaceProfile(remoteProfile));
          return;
        }

        lastPersistedProfileRef.current = fallbackProfileJson === EMPTY_PROFILE_JSON ? fallbackProfileJson : null;
      })
      .catch((error: unknown) =>
      {
        if (!isActive) {
          return;
        }

        console.error('Failed to load personalization profile.', error);
        lastPersistedProfileRef.current = fallbackProfileJson;
      })
      .finally(() =>
      {
        if (isActive) {
          setIsRemoteProfileReady(true);
        }
      });

    return () =>
    {
      isActive = false;
    };
  }, [apiKey, dispatch, isLoaded]);

  useEffect(() =>
  {
    if (!apiKey || !isLoaded || !isRemoteProfileReady) {
      return;
    }

    if (lastPersistedProfileRef.current === serializedProfile) {
      return;
    }

    let isActive = true;
    lastPersistedProfileRef.current = serializedProfile;

    void persistProfileToDatabase(profile, serializedProfile)
      .then((savedProfile) =>
      {
        if (!isActive) {
          return;
        }
      })
      .catch((error: unknown) =>
      {
        if (!isActive) {
          return;
        }

        console.error('Failed to save personalization profile.', error);
      });

    return () =>
    {
      isActive = false;
    };
  }, [apiKey, dispatch, isLoaded, isRemoteProfileReady, profile, serializedProfile]);

  return {
    apiKey,
    hasApiKey,
    isLoaded: isLoaded && isRemoteProfileReady,
    isSavingToDatabase,
    profile,
    setUserName: (userName?: string) => dispatch(actions.setUserName(userName)),
    setBestiaryColumnVisibility: (visibility: Partial<Record<BestiaryColumnPreferenceKey, boolean>>) => dispatch(actions.setBestiaryColumnVisibility(visibility)),
    clearBestiaryColumnVisibility: () => dispatch(actions.clearBestiaryColumnVisibility()),
    addQuickTag: (context: PersonalizationContext, tag: string) => dispatch(actions.addQuickTag({ context, tag })),
    addQuickExcludeTag: (context: PersonalizationContext, tag: string) => dispatch(actions.addQuickExcludeTag({ context, tag })),
    removeQuickTag: (context: PersonalizationContext, tag: string) => dispatch(actions.removeQuickTag({ context, tag })),
    removeQuickExcludeTag: (context: PersonalizationContext, tag: string) => dispatch(actions.removeQuickExcludeTag({ context, tag })),
    addFavoriteCharacter: (characterId: string) => dispatch(actions.addFavoriteCharacter(characterId)),
    removeFavoriteCharacter: (characterId: string) => dispatch(actions.removeFavoriteCharacter(characterId)),
    toggleFavoriteCharacter: (characterId: string) => dispatch(actions.toggleFavoriteCharacter(characterId)),
    setMainCharacter: (characterId?: string) => dispatch(actions.setMainCharacter(characterId)),
    addQuickLink: (quickLink: QuickLink) => dispatch(actions.addQuickLink(quickLink)),
    removeQuickLink: (quickLinkId: string) => dispatch(actions.removeQuickLink(quickLinkId)),
    updateQuickLink: (quickLink: QuickLink) => dispatch(actions.updateQuickLink(quickLink)),
    replaceProfile: (profile: PersonalizationProfile) => dispatch(actions.replaceProfile(profile)),
    saveToDatabase: async () => {
      if (!apiKey) {
        return profile;
      }

      lastPersistedProfileRef.current = serializedProfile;
      return await persistProfileToDatabase(profile, serializedProfile);
    },
  };
}