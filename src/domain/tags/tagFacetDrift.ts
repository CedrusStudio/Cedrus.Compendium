/**
 * Drift between the facet layer and the tags actually in the library (Wave 10.6).
 *
 * The descriptive layer and the data WILL drift — the only question is when.
 * Four directions, ordered by how much damage they do (Wave 10.8 added the
 * first and third, after a misassignment went unnoticed because nothing looked
 * for it):
 *
 *  - an `ineffectiveAssignment` is the only one that MISLEADS: the tag looks
 *    filed away and can never match, so the report says "solved" while nothing
 *    works;
 *  - a tag nobody defined is harmless but invisible as a grouping (it lands in
 *    "Pozostałe"), so it is worth surfacing once it becomes common;
 *  - `partialCoverage` is a question rather than a fault — the category works
 *    where it reaches, and elsewhere those tags fall back to "Pozostałe";
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
/**
 * A definition whose category covers NONE of the lists that actually carry the
 * tag. Assigning `krasnoludy` (Items only) to a category scoped to Mounts
 * creates one: the filter can never show it, yet the tag leaves the "unassigned"
 * list, so the report claims the problem is solved. Silent no-op — exactly the
 * failure mode the rest of this layer is built to avoid.
 */
export type IneffectiveAssignment = { tag: string; facetKey: string; tagEntities: string[]; facetEntities: string[] };
/**
 * A list that carries a category's tags but is not in that category's scope.
 *
 * Not a bug — those tags simply land in "Pozostałe" there, where the tag filter
 * still finds them — but invisible until named. Grouped by (category, list)
 * rather than per tag on purpose: the answer is always one decision for the
 * whole group ("should Źródło mocy also cover Postaci?"), and per-tag rows
 * turned that single question into six identical lines of noise.
 */
export type PartialCoverage = { facetKey: string; entity: string; tags: string[] };
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
  /** Assignments that cannot ever match — see `IneffectiveAssignment`. */
  ineffectiveAssignments: IneffectiveAssignment[];
  /** Assignments that reach only part of the tag's lists — see `PartialCoverage`. */
  partialCoverage: PartialCoverage[];
  /**
   * Which lists carry each tag. Sent to the panel so the category picker can
   * offer only categories that could actually do something — preventing the
   * ineffective assignment above instead of merely reporting it afterwards.
   */
  tagEntities: Record<string, string[]>;
};

/**
 * Lists that actually carry the tag, under any of its spellings.
 *
 * The category picker uses this to offer only categories that can do something:
 * a tag living on Items has no business being assigned to a Mounts-only axis.
 *
 * Pass `facets` whenever they are at hand. Without them the same spelling gets
 * credited to every definition claiming it, and the library has spellings that
 * mean two different things: the 25 `natura` Characters belong to `zwierzęta`
 * (via an alias scoped to Characters), not to the nature-magic `natura`. The
 * tie is broken by coverage — the definition whose category actually reaches
 * that list owns the word there.
 */
export function entitiesUsingTag(
  tag: string,
  usage: TagUsage,
  definitions: readonly TagDefinitionRecord[],
  facets: readonly TagFacetDefinition[] = [],
): string[]
{
  const definition = definitions.find(candidate => candidate.tag === tag) ?? { tag };
  const covers = (candidate: TagDefinitionRecord, entity: string): boolean =>
    facets.some(facet => facet.key === candidate.facetKey && facet.entities.includes(entity));

  const ownsHere = (spelling: string, entity: string): boolean =>
  {
    const claimants = definitions.filter(candidate =>
      spellingsForEntity(candidate, entity).includes(spelling));

    if (claimants.length < 2) return true;

    const covering = claimants.filter(candidate => covers(candidate, entity));
    // Nikt nie pokrywa albo pokrywa kilku — nie ma podstaw do rozstrzygnięcia,
    // więc nie zgadujemy. Ten pierwszy przypadek to zwykły rozjazd i zgłosi go
    // `partialCoverage`; drugi łapie test niezmienników seeda.
    return covering.length === 1 ? covering[0].tag === definition.tag : true;
  };

  return Object.entries(usage)
    .filter(([entity, tags]) => spellingsForEntity(definition, entity)
      .some(spelling => (tags[spelling] ?? 0) > 0 && ownsHere(spelling, entity)))
    .map(([entity]) => entity);
}

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

  const ineffectiveAssignments: IneffectiveAssignment[] = [];
  const partialByGroup = new Map<string, PartialCoverage>();

  for (const definition of definitions)
  {
    if (!definition.facetKey) continue;

    const facet = facets.find(candidate => candidate.key === definition.facetKey);
    if (!facet) continue;

    const tagEntities = entitiesUsingTag(definition.tag, usage, definitions, facets);
    // A tag nobody uses is already reported as an unused definition; flagging it
    // here too would just double the noise for one problem.
    if (tagEntities.length === 0) continue;

    const uncovered = tagEntities.filter(entity => !facet.entities.includes(entity));

    // Nothing covered at all is the dead assignment; something covered but not
    // everything is the softer question. They are the same measurement read at
    // two thresholds, so they are computed together and reported apart.
    if (uncovered.length < tagEntities.length)
    {
      for (const entity of uncovered)
      {
        const key = `${facet.key} → ${entity}`;
        const group = partialByGroup.get(key);
        if (group) group.tags.push(definition.tag);
        else partialByGroup.set(key, { facetKey: facet.key, entity, tags: [definition.tag] });
      }

      continue;
    }

    ineffectiveAssignments.push({
      tag: definition.tag,
      facetKey: facet.key,
      tagEntities,
      facetEntities: [...facet.entities],
    });
  }

  const partialCoverage = [...partialByGroup.values()].sort((left, right) => right.tags.length - left.tags.length);

  const tagEntities: Record<string, string[]> = {};
  for (const tag of new Set([...Object.values(usage).flatMap(Object.keys), ...definitions.map(d => d.tag)]))
  {
    tagEntities[tag] = entitiesUsingTag(tag, usage, definitions, facets);
  }

  return {
    ineffectiveAssignments,
    partialCoverage,
    tagEntities,
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
