"use client";

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useApiKey } from '@/common/hooks/useApiKey';
import battlePresetsClient from '@/infrastructure/clients/battlePresetsClient';
import type { BattleConfiguration } from '@/domain/battlePresets/BattleConfiguration';

// Exported so useApiKey.ts (invalidation on key change/removal) and tests
// reference the same prefix instead of a hand-typed string in two places.
export const BATTLE_PRESETS_QUERY_KEY_PREFIX = ['battle-presets'] as const;

/**
 * React Query, not the Redux slice pattern used by usePersonalization.ts —
 * this is a plain CRUD list scoped by API key, the same shape of problem as
 * useAdminEntityManagement.ts, which this hook is modeled on. Unlike
 * personalization (a single record that needs to be optimistically
 * available offline), there's no reason to duplicate that state into Redux.
 */
export function useBattlePresets()
{
  const { apiKey, hasApiKey } = useApiKey();
  const queryClient = useQueryClient();

  // apiKey is part of the query key so switching keys in ApiKeySettings
  // fetches a fresh list scoped to the new key, instead of showing a stale
  // cached list from the previous one (mirrors createSearchCharactersKey,
  // see visible-only-to-api-keys-implementation-plan.md, Etap 4).
  const queryKey = [...BATTLE_PRESETS_QUERY_KEY_PREFIX, apiKey] as const;

  const { data: presets = [], isLoading, error } = useQuery
  ({
    queryKey,
    queryFn: () => battlePresetsClient.list(),
    enabled: hasApiKey,
    staleTime: 5_000,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: BATTLE_PRESETS_QUERY_KEY_PREFIX });

  const createMutation = useMutation
  ({
    mutationFn: ({ name, configuration }: { name: string; configuration: BattleConfiguration }) =>
      battlePresetsClient.create(name, configuration),
    onSuccess: invalidate,
  });

  const updateMutation = useMutation
  ({
    mutationFn: ({ id, data }: { id: string; data: { name?: string; configuration?: BattleConfiguration } }) =>
      battlePresetsClient.update(id, data),
    onSuccess: invalidate,
  });

  const deleteMutation = useMutation
  ({
    mutationFn: (id: string) => battlePresetsClient.remove(id),
    onSuccess: invalidate,
  });

  // "Load" fetches the full preset (with configuration) on demand — modeled
  // as a mutation rather than a query since it's a one-off imperative action
  // triggered by a button click, not something a component subscribes to.
  const loadMutation = useMutation
  ({
    mutationFn: (id: string) => battlePresetsClient.getById(id),
  });

  return {
    presets,
    isLoading,
    hasError: Boolean(error),
    createMutation,
    updateMutation,
    deleteMutation,
    loadMutation,
  };
}
