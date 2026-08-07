/**
 * Tag renaming, everywhere a tag name is stored (Wave 9.0).
 *
 * A tag name does not live only in `tags: String[]`. It is also written into
 * `structuredRequirements` (`count` requirements filter by tag — Wave 8.1) and
 * into every user's personalization profile (`quickTagsByContext`). Renaming
 * only the first of the three leaves the other two pointing at a name that no
 * longer exists — silently, with no error and no empty-state to notice.
 *
 * Everything here is pure so the sweep can be unit-tested and dry-run without a
 * database. The persistence side lives in `src/persistence/tags`.
 */

import type { PersonalizationContext, PersonalizationProfile } from "@/common/personalization/personalizationProfile";
import type { Tag } from "@/domain/Tag";

/**
 * Replaces `oldTag` with `newTag` in one entity's tag list.
 *
 * Returns `null` when nothing changes, so callers can skip writes instead of
 * rewriting identical documents. Order is preserved and the result is
 * de-duplicated: an entity already carrying BOTH names collapses to one entry
 * rather than ending up with `["ofensywa", "ofensywa"]`.
 */
export function renameInTagList(tags: readonly string[], oldTag: Tag, newTag: Tag): string[] | null
{
  if (!tags.includes(oldTag)) return null;

  const renamed: string[] = [];

  for (const tag of tags)
  {
    const next = tag === oldTag ? newTag : tag;
    if (!renamed.includes(next)) renamed.push(next);
  }

  return renamed;
}

/** True when the entity already carries both names, so the rename is a merge rather than a swap. */
export function isTagMerge(tags: readonly string[], oldTag: Tag, newTag: Tag): boolean
{
  return tags.includes(oldTag) && tags.includes(newTag);
}

/**
 * Repoints every `tag` field inside a `structuredRequirements` array.
 *
 * Walks the structure generically instead of matching on `kind: "count"`. Today
 * `count` is the only variant carrying a tag and `anyOf` cannot nest one, but a
 * walker costs nothing and will not quietly miss a variant added later — which
 * is exactly how these references got missed in the first place.
 */
export function renameTagInRequirements<T>(requirements: T, oldTag: Tag, newTag: Tag): { value: T; occurrences: number }
{
  let occurrences = 0;

  const walk = (node: unknown): unknown =>
  {
    if (Array.isArray(node)) return node.map(walk);
    if (node === null || typeof node !== "object") return node;

    const result: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(node as Record<string, unknown>))
    {
      if (key === "tag" && value === oldTag)
      {
        occurrences += 1;
        result[key] = newTag;
        continue;
      }

      result[key] = walk(value);
    }

    return result;
  };

  return { value: walk(requirements) as T, occurrences };
}

/**
 * Personalization contexts a tag-management entity can reach.
 *
 * The two vocabularies do not line up: `powerSpecifications` is called `powers`
 * in the profile, and `characters` feeds two contexts because the bestiary is a
 * second view over the same collection. Renaming a Maneuver tag must not touch
 * the Perk quick tags, so this mapping is deliberately narrow.
 */
const ENTITY_PERSONALIZATION_CONTEXTS: Readonly<Record<string, readonly PersonalizationContext[]>> =
{
  characters: ["characters", "bestiary"],
  maneuvers: ["maneuvers"],
  stances: ["stances"],
  states: ["states"],
  perks: ["perks"],
  spells: ["spells"],
  races: ["races"],
  weapons: ["weapons"],
  armors: ["armors"],
  shields: ["shields"],
  inventory: ["inventory"],
  mounts: ["mounts"],
  powerSpecifications: ["powers"],
};

export function personalizationContextsForEntity(entity: string): readonly PersonalizationContext[]
{
  return ENTITY_PERSONALIZATION_CONTEXTS[entity] ?? [];
}

/**
 * Rewrites a tag name inside one profile's quick tags, in both the including
 * and the excluding list, for the given contexts only.
 *
 * Returns `null` when nothing changes. De-duplicates for the same reason
 * `renameInTagList` does — a user may already have both names pinned.
 */
export function renameTagInProfile(
  profile: PersonalizationProfile,
  contexts: readonly PersonalizationContext[],
  oldTag: Tag,
  newTag: Tag,
): PersonalizationProfile | null
{
  let changed = false;

  const rewrite = (byContext: Record<string, string[] | undefined>): Record<string, string[] | undefined> =>
  {
    const next = { ...byContext };

    for (const context of contexts)
    {
      const tags = next[context];
      if (!tags) continue;

      const renamed = renameInTagList(tags, oldTag, newTag);
      if (!renamed) continue;

      next[context] = renamed;
      changed = true;
    }

    return next;
  };

  const quickTagsByContext = rewrite(profile.quickTagsByContext);
  const quickExcludeTagsByContext = rewrite(profile.quickExcludeTagsByContext);

  if (!changed) return null;

  return { ...profile, quickTagsByContext, quickExcludeTagsByContext };
}

/** What a rename touched (or would touch, in dry-run). */
export type TagRenameReport =
{
  entity: string;
  oldTag: string;
  newTag: string;
  dryRun: boolean;
  /** Entity records whose `tags` array changes. */
  records: number;
  /** Of those, records already carrying `newTag` — the rename merges rather than swaps. */
  merged: number;
  /** `tag` references repointed inside `structuredRequirements`. */
  requirementReferences: number;
  /** Personalization profiles whose quick tags change. */
  profiles: number;
  /**
   * Whether the `TagDefinition` followed the rename. False when the old name
   * still lives on another entity — the definition stays put and the drift
   * report picks it up rather than the tag silently leaving its facet.
   */
  definitionMoved?: boolean;
};
