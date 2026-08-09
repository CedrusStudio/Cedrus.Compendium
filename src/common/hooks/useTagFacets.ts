"use client";

import { useQuery } from '@tanstack/react-query';
import type { EntityType } from '@/infrastructure/clients/tagsClient';
import { UNASSIGNED_FACET_KEY, type TagFacetIndex } from '@/domain/tags/tagFacets';

const EMPTY_INDEX: TagFacetIndex = { entity: '', facets: [], unassigned: [] };

/**
 * Coerces whatever came back into a usable index.
 *
 * `?? EMPTY_INDEX` is not enough: it only guards against `undefined`, while a
 * reachable-but-wrong response (an error envelope, an HTML error page, an empty
 * object, a mocked `fetch` in a test) is a defined value with no `facets` array
 * — and `index.facets.length` then throws inside render, taking the whole list
 * view down with it. The tag filter must not stop working because the
 * DESCRIPTIVE layer misbehaved, so the shape is checked rather than trusted.
 */
function toFacetIndex(value: unknown, entity: string): TagFacetIndex
{
  if (!value || typeof value !== 'object') return { ...EMPTY_INDEX, entity };

  const candidate = value as Partial<TagFacetIndex>;

  return {
    entity: typeof candidate.entity === 'string' ? candidate.entity : entity,
    facets: Array.isArray(candidate.facets) ? candidate.facets : [],
    unassigned: Array.isArray(candidate.unassigned) ? candidate.unassigned : [],
  };
}

/**
 * The category layer for one entity (Wave 10.4).
 *
 * A failure here is not an error state: an empty index means "no categories",
 * which the filter renders as the flat tag list. The query therefore does not
 * retry aggressively and never surfaces an error to the user.
 */
export const useTagFacets = (entity: EntityType) =>
{
  const { data, isLoading } = useQuery<TagFacetIndex>({
    queryKey: ['tagFacets', entity],
    queryFn: async () =>
    {
      const response = await fetch(`/api/tag-facets/${entity}`);
      if (!response.ok) return { ...EMPTY_INDEX, entity };
      return toFacetIndex(await response.json(), entity);
    },
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });

  // Normalized again on the way out: the cache can hold a value written before
  // this guard existed, and a test may stub `useQuery` itself.
  const index = toFacetIndex(data, entity);

  // Liczą się WYŁĄCZNIE prawdziwe kategorie. „Pozostałe" jest też facetem
  // (żeby dało się je klikać), ale lista mająca tylko je nie zyskuje niczego na
  // trybie kategorii — byłby to gorszy filtr tagów pod inną nazwą.
  const hasFacets = index.facets.some(facet => facet.key !== UNASSIGNED_FACET_KEY);

  return { index, isLoading, hasFacets };
};
