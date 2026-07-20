"use client";

/**
 * List + delete saved simulation runs (React Query over combatLabClient),
 * scoped by API key like the rest of the app's per-key data.
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import combatLabClient, { type SavedSimulationRowDto } from "@/infrastructure/clients/combatLabClient";
import { useApiKey } from "@/common/hooks/useApiKey";

const listKey = (apiKey?: string | null) => ["combat-lab-simulations", apiKey ?? ""] as const;

export function useSavedSimulations()
{
  const { apiKey } = useApiKey();
  const queryClient = useQueryClient();

  const { data = [], isLoading, error } = useQuery<SavedSimulationRowDto[]>({
    queryKey: listKey(apiKey),
    queryFn: () => combatLabClient.listSimulations(),
    staleTime: 5_000,
  });

  const remove = useMutation({
    mutationFn: (id: string) => combatLabClient.removeSimulation(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: listKey(apiKey) }),
  });

  return {
    simulations: data,
    isLoading,
    error: error as Error | null,
    remove: (id: string) => remove.mutateAsync(id),
    isRemoving: remove.isPending,
  };
}
