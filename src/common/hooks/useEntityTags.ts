"use client";

import { useQuery } from '@tanstack/react-query';
import tagsClient, { EntityType } from '@/infrastructure/clients/tagsClient';

export type { EntityType };

const EMPTY_TAGS: string[] = [];

export const useEntityTags = (entity: EntityType) => 
{
  const { data: tags, isLoading, error } = useQuery<string[]>
  ({
    queryKey: ['entityTags', entity],
    queryFn: () => tagsClient.getEntityTags(entity),
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    retry: 2,
  });

  return { tags: tags ?? EMPTY_TAGS, isLoading, error };
};
