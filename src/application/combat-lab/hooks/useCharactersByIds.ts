"use client";

/**
 * Fetch several full domain `Character`s at once from the batch endpoint,
 * used by the Matchup Analyzer, which needs every selected combatant's
 * character to build snapshots.
 */

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import charactersClient from "@/infrastructure/clients/charactersClient";
import { useApiKey } from "@/common/hooks/useApiKey";
import type { Character } from "@/domain/characters/Character";

export function useCharactersByIds(ids: string[]): { byId: Map<string, Character>; isLoading: boolean }
{
  const { apiKey } = useApiKey();
  const sorted = useMemo(() => [...ids].sort(), [ids]);

  const { data = [], isLoading } = useQuery<Character[]>({
    queryKey: ["combat-lab-characters-by-ids", sorted, apiKey ?? ""],
    queryFn: async () =>
    {
      if (sorted.length === 0) return [];
      return charactersClient.getByIds(sorted);
    },
    enabled: sorted.length > 0,
    staleTime: 5_000,
  });

  const byId = useMemo(() => new Map(data.map(c => [c.id, c])), [data]);
  return { byId, isLoading };
}
