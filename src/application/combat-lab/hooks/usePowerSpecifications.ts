"use client";

/**
 * Load the `PowerSpecification`s referenced by a character's powers. The domain
 * `Character` carries only `powerSpecificationId` references (the specs live in
 * a separate collection), so the Combat Lab must fetch them separately to
 * resolve castable spells into damage offenses (see magic-attacks plan, etap 1).
 *
 * Returns a `Record<specId, PowerSpecification>` ready to pass as the
 * `powerSpecifications` snapshot option.
 */

import { useQuery } from "@tanstack/react-query";
import searchClient from "@/infrastructure/clients/searchClient";
import type { SearchByIdEntityPayload } from "@/common/global/SearchPayloads";
import { useApiKey } from "@/common/hooks/useApiKey";
import type { Character } from "@/domain/characters/Character";
import type { PowerSpecification } from "@/domain/characters/combat/Power";

const specByIdPayload: SearchByIdEntityPayload = { entity: "powerSpecification" };

/** Unique, non-empty specification ids referenced by a character's powers. */
function specIdsOf(character: Character | null | undefined): string[]
{
  if (!character) return [];
  const ids = new Set<string>();
  for (const power of character.powers)
  {
    if (power.powerSpecificationId) ids.add(power.powerSpecificationId);
  }
  return [...ids];
}

export function usePowerSpecifications(character: Character | null | undefined):
  { specifications: Record<string, PowerSpecification>; isLoading: boolean }
{
  const { apiKey } = useApiKey();
  const ids = specIdsOf(character);

  const { data, isLoading } = useQuery<Record<string, PowerSpecification>>({
    queryKey: ["combat-lab", "power-specifications", apiKey, ...ids],
    queryFn: async () =>
    {
      const entries = await Promise.all(
        ids.map(async id =>
        {
          const spec = await searchClient.searchById<PowerSpecification>(id, specByIdPayload);
          return [id, spec] as const;
        }),
      );
      return Object.fromEntries(entries);
    },
    enabled: ids.length > 0,
    staleTime: 5_000,
  });

  return { specifications: data ?? {}, isLoading };
}
