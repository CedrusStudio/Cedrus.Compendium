/**
 * Tag facets — the descriptive layer over `tags: String[]` (Wave 10).
 *
 * A facet groups tags along one axis (role, creature kind, style, weapon…) so
 * the filter can ask "offensive maneuvers that belong to no creature kind"
 * instead of making the user exclude nine tags by hand.
 *
 * Two properties everything else depends on:
 *
 *  - **Aliases are per entity.** The library names the same axis differently on
 *    either side: a Maneuver says `nieumarli`, a Character says `nieumarły`, and
 *    an animal Character is tagged `natura` — a word that means "school of
 *    magic" on a Spell or Perk (107 records) and "natural material" on an Item.
 *    A global alias would drag all of those into the creature-kind facet, so an
 *    alias only ever applies to the entities it names.
 *
 *  - **A tag without a definition is still visible.** Every consumer must fall
 *    back to an "unassigned" bucket. Silently hiding a tag is the only way this
 *    feature could actually do harm, so it is ruled out by construction.
 *
 * Everything here is pure: no Prisma, no fetch. The same index feeds the Prisma
 * `findMany` path and the `aggregateRaw` pipeline, which is what keeps those two
 * from drifting apart.
 */

export type TagSelectionMode = "multi" | "single";

export type TagFacetDefinition =
{
  key: string;
  label: string;
  description?: string | null;
  order: number;
  selectionMode: TagSelectionMode;
  supportsNone: boolean;
  /** Tag-management entity names, e.g. `["maneuvers", "characters"]`. */
  entities: readonly string[];
};

/** A spelling equivalent to the canonical tag, for the listed entities only. */
export type TagAliasDefinition = { alias: string; entities: readonly string[] };

export type TagDefinitionRecord =
{
  tag: string;
  facetKey?: string | null;
  label?: string | null;
  order?: number | null;
  aliases?: readonly TagAliasDefinition[];
  formerNames?: readonly string[];
};

/** One selectable value inside a facet, resolved for a specific entity. */
export type TagFacetValue =
{
  /** Canonical tag — what the client sends and what the UI labels. */
  tag: string;
  label: string;
  /** Every spelling that counts as this value ON THIS ENTITY, canonical first. */
  spellings: string[];
};

/** A facet resolved for one entity: its values and the union of their spellings. */
export type ResolvedTagFacet = TagFacetDefinition &
{
  values: TagFacetValue[];
  /** Union of every spelling in the facet — what "— brak —" negates. */
  allSpellings: string[];
};

export type TagFacetIndex =
{
  entity: string;
  facets: ResolvedTagFacet[];
  /** Tags present on the entity that no definition claims. Never hidden. */
  unassigned: string[];
};

/**
 * Reserved key for the "Pozostałe" bucket (Wave 10.9).
 *
 * Uncategorised tags used to be printed as read-only text with "search for them
 * in Tagi mode" — which meant leaving category mode and losing every choice
 * already made. They are now a section like any other: OR inside, AND with the
 * real categories. The bucket is NOT an axis, so it never offers "— brak —"
 * (that would read as "entries with no uncategorised tag", which nobody wants).
 *
 * The double underscore keeps it out of reach of real keys, which are slugs;
 * a contract test asserts the seed never claims it.
 */
export const UNASSIGNED_FACET_KEY = "__pozostale__";

/** Spellings of one definition that are valid for `entity`, canonical first. */
export function spellingsForEntity(definition: TagDefinitionRecord, entity: string): string[]
{
  const spellings = [definition.tag];

  for (const alias of definition.aliases ?? [])
  {
    if (!alias.entities.includes(entity)) continue;
    if (spellings.includes(alias.alias)) continue;
    spellings.push(alias.alias);
  }

  return spellings;
}

/**
 * Builds the per-entity view of the facet layer.
 *
 * `availableTags` is the distinct tag list actually present on that entity (the
 * existing `/api/tags/[entity]` aggregation). It does two jobs: it decides what
 * lands in `unassigned`, and it keeps a facet from advertising values the entity
 * does not have — a Maneuver filter should not offer `anioł` just because the
 * creature-kind facet also covers Races.
 *
 * Omit it when building the index to FILTER rather than to render. Search does
 * not need to know which values exist: an extra spelling in an `$in` matches
 * nothing and costs nothing, whereas making every query first aggregate the
 * distinct tag list would put a collection scan in front of every search.
 */
export function buildTagFacetIndex(
  entity: string,
  facets: readonly TagFacetDefinition[],
  definitions: readonly TagDefinitionRecord[],
  availableTags?: readonly string[],
): TagFacetIndex
{
  const available = availableTags === undefined ? null : new Set(availableTags);
  const claimed = new Set<string>();

  const resolved = facets
    .filter(facet => facet.entities.includes(entity))
    .sort((left, right) => left.order - right.order)
    .map(facet =>
    {
      const values: TagFacetValue[] = [];
      const allSpellings: string[] = [];

      const members = definitions
        .filter(definition => definition.facetKey === facet.key)
        .sort(byDefinitionOrder);

      for (const definition of members)
      {
        const all = spellingsForEntity(definition, entity);
        const spellings = available === null ? all : all.filter(spelling => available.has(spelling));
        if (spellings.length === 0) continue;

        for (const spelling of spellings)
        {
          claimed.add(spelling);
          if (!allSpellings.includes(spelling)) allSpellings.push(spelling);
        }

        values.push({ tag: definition.tag, label: definition.label ?? definition.tag, spellings });
      }

      return { ...facet, values, allSpellings };
    })
    // A facet with nothing to show on this entity is noise, not information.
    .filter(facet => facet.values.length > 0);

  const unassigned = (availableTags ?? [])
    .filter(tag => !claimed.has(tag))
    .sort((left, right) => left.localeCompare(right, "pl"));

  return {
    entity,
    facets: unassigned.length > 0 ? [...resolved, unassignedFacet(entity, unassigned)] : resolved,
    unassigned,
  };
}

/**
 * The "Pozostałe" bucket dressed as a facet so the filter can select it.
 *
 * An unassigned tag has no aliases — nothing claims it — so its canonical value
 * IS its spelling. Rendered last (`order` at the maximum) because it is the
 * leftovers, not an axis.
 */
function unassignedFacet(entity: string, unassigned: readonly string[]): ResolvedTagFacet
{
  return {
    key: UNASSIGNED_FACET_KEY,
    label: "Pozostałe",
    description: "Tagi, których nie obejmuje żadna kategoria. Wybierasz je tak samo — sumują się między sobą i zawężają razem z kategoriami.",
    order: Number.MAX_SAFE_INTEGER,
    selectionMode: "multi",
    supportsNone: false,
    entities: [entity],
    values: unassigned.map(tag => ({ tag, label: tag, spellings: [tag] })),
    allSpellings: [...unassigned],
  };
}

function byDefinitionOrder(left: TagDefinitionRecord, right: TagDefinitionRecord): number
{
  const leftOrder = left.order ?? Number.MAX_SAFE_INTEGER;
  const rightOrder = right.order ?? Number.MAX_SAFE_INTEGER;
  if (leftOrder !== rightOrder) return leftOrder - rightOrder;
  return left.tag.localeCompare(right.tag, "pl");
}

// ---------------------------------------------------------------- filtering

/** What the client sends: canonical values, never spellings. */
export type TagFacetFilter =
{
  facetKey: string;
  /** Canonical tags selected in this facet — combined with OR. */
  tags: string[];
  /** Also accept records carrying no tag from this facet ("— brak —"). */
  includeNone?: boolean;
};

/**
 * A single facet's condition, in a form neither Prisma nor Mongo owns.
 *
 * Matches when `anyOf` is non-empty and the record carries one of them, OR when
 * `noneOf` is set and the record carries none of them. Both present means the
 * user picked values *and* "— brak —", which is a union, not an intersection.
 */
export type TagFacetCondition =
{
  facetKey: string;
  anyOf: string[];
  noneOf: string[] | null;
};

/**
 * Expands client filters into conditions, resolving canonical values to the
 * spellings valid for this entity.
 *
 * Filters naming an unknown facet, or values no definition claims, are dropped
 * rather than guessed at — a typo in a saved query should narrow nothing, not
 * silently match everything.
 */
export function buildTagFacetConditions(
  filters: readonly TagFacetFilter[],
  index: TagFacetIndex,
): TagFacetCondition[]
{
  const conditions: TagFacetCondition[] = [];

  for (const filter of filters)
  {
    // "Pozostałe" is resolved WITHOUT the index on purpose. The search-side
    // index is built without `availableTags` (see `buildTagFacetIndex`), so the
    // bucket is empty there — looking the facet up would drop the filter and
    // silently widen the result set. Unassigned tags carry no aliases, so the
    // value sent by the client is already the spelling to match.
    if (filter.facetKey === UNASSIGNED_FACET_KEY)
    {
      const anyOf = filter.tags.filter((tag, position) => tag !== "" && filter.tags.indexOf(tag) === position);
      if (anyOf.length > 0) conditions.push({ facetKey: filter.facetKey, anyOf, noneOf: null });
      continue;
    }

    const facet = index.facets.find(candidate => candidate.key === filter.facetKey);
    if (!facet) continue;

    const anyOf: string[] = [];

    for (const tag of filter.tags)
    {
      const value = facet.values.find(candidate => candidate.tag === tag);
      if (!value) continue;

      for (const spelling of value.spellings)
      {
        if (!anyOf.includes(spelling)) anyOf.push(spelling);
      }
    }

    // "— brak —" negates the WHOLE facet, aliases included. Computing it from
    // the selected values instead would let `natura`-tagged Characters show up
    // under "Characters with no creature kind".
    const noneOf = filter.includeNone && facet.supportsNone && facet.allSpellings.length > 0
      ? [...facet.allSpellings]
      : null;

    if (anyOf.length === 0 && noneOf === null) continue;

    conditions.push({ facetKey: facet.key, anyOf, noneOf });
  }

  return conditions;
}

// ---------------------------------------------------------------- renderers

export type PrismaTagCondition =
  | { tags: { hasSome: string[] } }
  | { NOT: { tags: { hasSome: string[] } } }
  | { OR: PrismaTagCondition[] };

/** Conditions as Prisma `where` clauses, to be AND-ed by the caller. */
export function toPrismaTagConditions(conditions: readonly TagFacetCondition[]): PrismaTagCondition[]
{
  return conditions.map(condition =>
  {
    const parts: PrismaTagCondition[] = [];
    if (condition.anyOf.length > 0) parts.push({ tags: { hasSome: condition.anyOf } });
    if (condition.noneOf) parts.push({ NOT: { tags: { hasSome: condition.noneOf } } });
    return parts.length === 1 ? parts[0]! : { OR: parts };
  });
}

export type MongoTagCondition = Record<string, unknown>;

/** The same conditions as Mongo `$match` fragments, to be AND-ed by the caller. */
export function toMongoTagConditions(conditions: readonly TagFacetCondition[]): MongoTagCondition[]
{
  return conditions.map(condition =>
  {
    const parts: MongoTagCondition[] = [];
    if (condition.anyOf.length > 0) parts.push({ tags: { $in: condition.anyOf } });
    if (condition.noneOf) parts.push({ tags: { $nin: condition.noneOf } });
    return parts.length === 1 ? parts[0]! : { $or: parts };
  });
}
