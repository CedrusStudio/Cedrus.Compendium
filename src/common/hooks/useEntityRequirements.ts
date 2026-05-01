"use client";

import { useQuery } from '@tanstack/react-query';
import requirementsClient, { RequirementEntityType } from '@/infrastructure/clients/requirementsClient';

export type { RequirementEntityType };

const EMPTY_REQUIREMENTS: string[] = [];

export const useEntityRequirements = (entity: RequirementEntityType) =>
{
  const { data: requirements, isLoading, error } = useQuery<string[]>
  ({
    queryKey: ['entityRequirements', entity],
    queryFn: () => requirementsClient.getEntityRequirements(entity),
    staleTime: 5 * 60 * 1000,
    retry: 2,
  });

  return { requirements: requirements ?? EMPTY_REQUIREMENTS, isLoading, error };
};