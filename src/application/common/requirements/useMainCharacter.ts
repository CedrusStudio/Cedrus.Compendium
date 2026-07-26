"use client";

/**
 * The user's "main" character as a full domain `Character` (or `undefined` when
 * none is set). Reads `mainCharacterId` via a lightweight Redux selector — NOT
 * `usePersonalization`, which carries a save-to-DB effect that would fire once
 * per mount (this hook is used in per-item compendium views). The heavy fetch +
 * mapping is shared/cached through `useCharactersByIds`.
 */

import { useMemo } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/persistence/slices/store";
import { useApiKey } from "@/common/hooks/useApiKey";
import { useCharactersByIds } from "@/application/combat-lab/hooks/useCharactersByIds";
import type { Character } from "@/domain/characters/Character";

const NO_IDS: string[] = [];

export function useMainCharacter(): Character | undefined
{
  const { apiKey } = useApiKey();
  const mainCharacterId = useSelector((state: RootState) =>
    (apiKey ? state.personalization.profilesByApiKey[apiKey]?.mainCharacterId : undefined));

  const ids = useMemo(() => (mainCharacterId ? [mainCharacterId] : NO_IDS), [mainCharacterId]);
  const { byId } = useCharactersByIds(ids);

  return mainCharacterId ? byId.get(mainCharacterId) : undefined;
}
