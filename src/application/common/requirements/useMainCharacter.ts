"use client";

/**
 * The user's "main" character as a full domain `Character` (or `undefined` when
 * none is set). Per-item compendium views subscribe to the ID only. Fetching
 * and mapping the character are shared through `useCharactersByIds`.
 */

import { useMemo } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/persistence/slices/store";
import { useApiKey } from "@/common/hooks/useApiKey";
import { useCharactersByIds } from "@/application/combat-lab/hooks/useCharactersByIds";
import type { Character } from "@/domain/characters/Character";

const NO_IDS: string[] = [];

export function useMainCharacter(enabled = true): Character | undefined
{
  const { apiKey } = useApiKey();
  const mainCharacterId = useSelector((state: RootState) =>
    (apiKey ? state.personalization.profilesByApiKey[apiKey]?.mainCharacterId : undefined));

  const ids = useMemo(() => (enabled && mainCharacterId ? [mainCharacterId] : NO_IDS), [enabled, mainCharacterId]);
  const { byId } = useCharactersByIds(ids);

  return enabled && mainCharacterId ? byId.get(mainCharacterId) : undefined;
}
