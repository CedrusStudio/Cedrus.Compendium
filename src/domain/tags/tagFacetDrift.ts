/**
 * Drift between the facet layer and the tags actually in the library (Wave 9.6).
 *
 * The descriptive layer and the data WILL drift — the only question is when. Two
 * directions, with very different weight:
 *
 *  - a tag nobody defined is harmless but invisible as a grouping (it lands in
 *    "Pozostałe"), so it is worth surfacing once it becomes common;
 *  - a definition nothing uses is dead weight, and often the fossil of a rename
 *    that happened outside the panel.
 *
 * Pure, so the admin report and the contract test agree by construction.
 */

import type { TagDefinitionRecord, TagFacetDefinition } from "@/domain/tags/tagFacets";
import { spellingsForEntity } from "@/domain/tags/tagFacets";

/** Tag counts per tag-management entity, as the drift check consumes them. */
export type TagUsage = Record<string, Record<string, number>>;

export type UndefinedTag = { tag: string; entities: string[]; occurrences: number };
export type UnusedDefinition = { tag: string; facetKey: string | null };
export type DeadFacetEntity = { facetKey: string; entity: string };

export type TagFacetDrift =
{
  /** Tags in the library that no definition claims, busiest first. */
  undefinedTags: UndefinedTag[];
  /** Definitions whose canonical name and aliases appear nowhere. */
  unusedDefinitions: UnusedDefinition[];
  /** Facets scoped to an entity that carries none of their tags. */
  deadFacetEntities: DeadFacetEntity[];
};

export function findTagFacetDrift(
  usage: TagUsage,
  facets: readonly TagFacetDefinition[],
  definitions: readonly TagDefinitionRecord[],
): TagFacetDrift
{
  const claimed = new Set<string>();
  for (const definition of definitions)
  {
    claimed.add(definition.tag);
    for (const alias of definition.aliases ?? []) claimed.add(alias.alias);
  }

  const undefinedByTag = new Map<string, UndefinedTag>();

  for (const [entity, tags] of Object.entries(usage))
  {
    for (const [tag, count] of Object.entries(tags))
    {
      if (claimed.has(tag)) continue;

      const existing = undefinedByTag.get(tag);
      if (existing)
      {
        existing.entities.push(entity);
        existing.occurrences += count;
        continue;
      }

      undefinedByTag.set(tag, { tag, entities: [entity], occurrences: count });
    }
  }

  const usedAnywhere = (definition: TagDefinitionRecord): boolean =>
    Object.entries(usage).some(([entity, tags]) =>
      spellingsForEntity(definition, entity).some(spelling => (tags[spelling] ?? 0) > 0));

  const deadFacetEntities: DeadFacetEntity[] = [];

  for (const facet of facets)
  {
    const members = definitions.filter(definition => definition.facetKey === facet.key);

    for (const entity of facet.entities)
    {
      const tags = usage[entity] ?? {};
      const alive = members.some(definition =>
        spellingsForEntity(definition, entity).some(spelling => (tags[spelling] ?? 0) > 0));

      if (!alive) deadFacetEntities.push({ facetKey: facet.key, entity });
    }
  }

  return {
    undefinedTags: [...undefinedByTag.values()].sort((left, right) => right.occurrences - left.occurrences),
    unusedDefinitions: definitions
      .filter(definition => !usedAnywhere(definition))
      .map(definition => ({ tag: definition.tag, facetKey: definition.facetKey ?? null })),
    deadFacetEntities,
  };
}

/**
 * Threshold for the contract test: below it a stray tag is a typo in one record,
 * above it somebody introduced a vocabulary nobody grouped. Zero would make CI
 * fail on a single mistyped tag, which trains people to ignore it.
 */
export const DRIFT_ALERT_THRESHOLD = 10;

/** Undefined tags common enough that leaving them ungrouped is a real gap. */
export function significantUndefinedTags(drift: TagFacetDrift, threshold = DRIFT_ALERT_THRESHOLD): UndefinedTag[]
{
  return drift.undefinedTags.filter(entry => entry.occurrences >= threshold);
}
