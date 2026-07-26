"use client";

import { useQuery } from '@tanstack/react-query';
import entityNamesClient from '@/infrastructure/clients/entityNamesClient';
import type { EntityRequirementGroup } from '@/domain/requirements/Requirement';

const EMPTY_NAMES: string[] = [];

/** Distinct names for a compendium entity group (maneuvers/stances/…). */
export const useEntityNames = (group: EntityRequirementGroup) =>
{
  const { data, isLoading, error } = useQuery<string[]>({
    queryKey: ['entityNames', group],
    queryFn: () => entityNamesClient.getEntityNames(group),
    staleTime: 5 * 60 * 1000,
    retry: 2,
  });

  return { names: data ?? EMPTY_NAMES, isLoading, error };
};
