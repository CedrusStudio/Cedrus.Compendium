"use client";

/**
 * Load stance/state rank families from the shared library for the Combat Lab
 * picker. Characters don't carry stances/states on the sheet (engine-model-gaps
 * §1), so a combatant's active stance is chosen from the library here. Records
 * of the same name across grades are grouped into `ModeFamily` (variants keyed
 * by grade) so a starting grade can be picked and rank-ups can swap variants.
 */

import { useQuery } from "@tanstack/react-query";
import searchClient from "@/infrastructure/clients/searchClient";
import { SearchQueryBuilder } from "@/infrastructure/searchQueries/SearchQueryBuilder";
import { emptyUlid } from "@/common/global/pagination";
import { useApiKey } from "@/common/hooks/useApiKey";
import type { Mode } from "@/domain/characters/combat/Mode";
import { groupModeFamilies, type ModeFamily } from "@/domain/combat-lab/effects/ModeDefinition";

export type ModeKind = "stance" | "state";

export function useModeFamilies(kind: ModeKind, search: string): { families: ModeFamily[]; isLoading: boolean }
{
  const { apiKey } = useApiKey();

  const { data, isLoading } = useQuery<Mode[]>({
    queryKey: ["combat-lab", "mode-families", kind, search, apiKey],
    queryFn: async () =>
    {
      const query = SearchQueryBuilder.for(kind)
        .searchFilter("name", search || undefined)
        .cursorPagination(emptyUlid, 200)
        .build();
      return await searchClient.search<Mode[]>(query);
    },
    staleTime: 5_000,
  });

  return { families: groupModeFamilies(data ?? []), isLoading };
}
