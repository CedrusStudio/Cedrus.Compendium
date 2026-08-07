/**
 * Loads the facet layer for search (Wave 9.3).
 *
 * `TagFacet` and `TagDefinition` are small (tens of rows) and change only when
 * an admin edits them, but a search runs on every keystroke — so the layer is
 * cached in module scope with a short TTL. A stale entry costs at most a few
 * seconds of an old grouping; re-reading two collections per query would put a
 * pointless round trip in front of every search.
 *
 * The index is built WITHOUT `availableTags`: filtering does not need to know
 * which values the entity actually has (an unused spelling in an `$in` matches
 * nothing), and computing it would mean a distinct-tag aggregation per query.
 */

import prisma from "@/lib/prisma";
import {
  buildTagFacetIndex,
  type TagDefinitionRecord,
  type TagFacetDefinition,
  type TagFacetIndex,
  type TagSelectionMode,
} from "@/domain/tags/tagFacets";

const CACHE_TTL_MS = 30_000;

type Layer = { facets: TagFacetDefinition[]; definitions: TagDefinitionRecord[] };

let cached: { layer: Layer; loadedAt: number } | null = null;

/** Drops the cache so an admin edit shows up without waiting out the TTL. */
export function invalidateTagFacetLayer(): void
{
  cached = null;
}

export async function loadTagFacetLayer(): Promise<Layer>
{
  if (cached && Date.now() - cached.loadedAt < CACHE_TTL_MS) return cached.layer;

  const [facetRows, definitionRows] = await Promise.all([
    prisma.tagFacet.findMany(),
    prisma.tagDefinition.findMany(),
  ]);

  const layer: Layer =
  {
    facets: facetRows.map(row => ({
      key: row.key,
      label: row.label,
      description: row.description,
      order: row.order,
      selectionMode: row.selectionMode === "single" ? "single" : "multi" as TagSelectionMode,
      supportsNone: row.supportsNone,
      entities: row.entities,
    })),
    definitions: definitionRows.map(row => ({
      tag: row.tag,
      facetKey: row.facetKey,
      label: row.label,
      order: row.order,
      aliases: row.aliases.map(alias => ({ alias: alias.alias, entities: alias.entities })),
      formerNames: row.formerNames,
    })),
  };

  cached = { layer, loadedAt: Date.now() };
  return layer;
}

/** Facet index for filtering. `availableTags` omitted on purpose — see the header. */
export async function loadTagFacetIndexForFiltering(entity: string): Promise<TagFacetIndex>
{
  const { facets, definitions } = await loadTagFacetLayer();
  return buildTagFacetIndex(entity, facets, definitions);
}

/** Facet index for RENDERING, narrowed to the tags the entity actually carries. */
export async function loadTagFacetIndexForDisplay(entity: string, availableTags: readonly string[]): Promise<TagFacetIndex>
{
  const { facets, definitions } = await loadTagFacetLayer();
  return buildTagFacetIndex(entity, facets, definitions, availableTags);
}
