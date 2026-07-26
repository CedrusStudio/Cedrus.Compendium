"use client";

import { useQuery } from "@tanstack/react-query";
import charactersClient from "@/infrastructure/clients/charactersClient";
import { useApiKey } from "@/common/hooks/useApiKey";
import { type OwningEntity, type OwningCharacter } from "@/common/global/owningEntity";

/**
 * Reverse lookup for the "Posiadane przez postacie" section. Lazy: pass
 * `enabled` (e.g. only once the section is expanded) to avoid fetching for
 * every compendium row on mount.
 */
export function useOwningCharacters(entity: OwningEntity, id: string, enabled: boolean)
{
  const { apiKey } = useApiKey();

  return useQuery<OwningCharacter[]>({
    queryKey: ["owning-characters", entity, id, apiKey],
    queryFn: () => charactersClient.getOwningCharacters(entity, id),
    enabled: enabled && Boolean(id),
    staleTime: 10_000,
  });
}
