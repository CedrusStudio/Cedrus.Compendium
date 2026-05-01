"use client";

import { useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useApiKey } from '@/common/hooks/useApiKey';
import { AppDispatch, RootState } from '@/persistence/slices/store';
import { actions, createEmptyProfile, PersonalizationContext, PersonalizationProfile, QuickLink } from '@/persistence/slices/personalizationSlice';
import { BestiaryColumnPreferenceKey } from '@/application/bestiary/bestiaryColumnPreferences';

export function usePersonalization()
{
  const dispatch = useDispatch<AppDispatch>();
  const { apiKey, hasApiKey, isLoaded } = useApiKey();
  const storedProfile = useSelector((state: RootState) => (apiKey ? state.personalization.profilesByApiKey[apiKey] : undefined));

  useEffect(() => 
  {
    dispatch(actions.setActiveApiKey(apiKey));
  }, [apiKey, dispatch]);

  const profile = useMemo(() => storedProfile ?? createEmptyProfile(), [storedProfile]);

  return {
    apiKey,
    hasApiKey,
    isLoaded,
    profile,
    setUserName: (userName?: string) => dispatch(actions.setUserName(userName)),
    setBestiaryColumnVisibility: (visibility: Partial<Record<BestiaryColumnPreferenceKey, boolean>>) => dispatch(actions.setBestiaryColumnVisibility(visibility)),
    clearBestiaryColumnVisibility: () => dispatch(actions.clearBestiaryColumnVisibility()),
    addQuickTag: (context: PersonalizationContext, tag: string) => dispatch(actions.addQuickTag({ context, tag })),
    removeQuickTag: (context: PersonalizationContext, tag: string) => dispatch(actions.removeQuickTag({ context, tag })),
    addFavoriteCharacter: (characterId: string) => dispatch(actions.addFavoriteCharacter(characterId)),
    removeFavoriteCharacter: (characterId: string) => dispatch(actions.removeFavoriteCharacter(characterId)),
    toggleFavoriteCharacter: (characterId: string) => dispatch(actions.toggleFavoriteCharacter(characterId)),
    setMainCharacter: (characterId?: string) => dispatch(actions.setMainCharacter(characterId)),
    addQuickLink: (quickLink: QuickLink) => dispatch(actions.addQuickLink(quickLink)),
    removeQuickLink: (quickLinkId: string) => dispatch(actions.removeQuickLink(quickLinkId)),
    updateQuickLink: (quickLink: QuickLink) => dispatch(actions.updateQuickLink(quickLink)),
    replaceProfile: (profile: PersonalizationProfile) => dispatch(actions.replaceProfile(profile)),
  };
}