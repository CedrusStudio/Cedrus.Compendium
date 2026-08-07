"use client";

import { useQuery } from '@tanstack/react-query';
import type { EntityType } from '@/infrastructure/clients/tagsClient';
import type { TagFacetIndex } from '@/domain/tags/tagFacets';

const EMPTY_INDEX: TagFacetIndex = { entity: '', facets: [], unassigned: [] };

/**
 * The facet layer for one entity (Wave 9.4).
 *
 * A failure here is not an error state: an empty index means "no facets", which
 * the filter renders as today's flat list. The tag filter must not stop working
 * because the descriptive layer is unavailable, so the query does not retry
 * aggressively and never surfaces an error to the user.
 */
export const useTagFacets = (entity: EntityType) =>
{
  const { data, isLoading } = useQuery<TagFacetIndex>({
    queryKey: ['tagFacets', entity],
    queryFn: async () =>
    {
      const response = await fetch(`/api/tag-facets/${entity}`);
      if (!response.ok) return { ...EMPTY_INDEX, entity };
      return await response.json() as TagFacetIndex;
    },
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });

  const index = data ?? EMPTY_INDEX;

  return { index, isLoading, hasFacets: index.facets.length > 0 };
};
