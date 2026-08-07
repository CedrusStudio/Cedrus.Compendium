/**
 * The write side of a tag deletion (Wave 9.2).
 *
 * Delete is the more dangerous of the two tag operations: a rename can be undone
 * by renaming back, but a delete drops the tag from N records WITHOUT recording
 * what it removed. The report is therefore the only artefact of what happened —
 * it names every affected record so a dry run can be read before committing, and
 * so the rows can be found again in a backup if the delete was a mistake.
 *
 * Like the rename, the entity sweep is a single raw Mongo command rather than N
 * updates, and the personalization profiles are swept too — quick tags pointing
 * at a tag that no longer exists find nothing, silently.
 *
 * `structuredRequirements` are deliberately NOT edited. A `count` requirement
 * pointing at a deleted tag becomes unsatisfiable, which is a content decision
 * (drop the requirement? repoint it?), not something a delete button should
 * guess at. They are counted and reported instead.
 */

import type { Tag } from "@/domain/Tag";
import { personalizationContextsForEntity } from "@/domain/tags/renameTagOccurrences";
import { requirementBearingEntities, tagEntityCollectionMap, tagEntityModelMap } from "@/lib/tagEntityModels";
import { invalidateTagFacetLayer } from "@/persistence/tags/tagFacetLayer";
import { sanitizeProfile, type PersonalizationProfile } from "@/common/personalization/personalizationProfile";
import type { TagRenameClient } from "@/persistence/tags/renameTagEverywhere";

export type TagDeleteReport =
{
  entity: string;
  tag: string;
  dryRun: boolean;
  records: number;
  /** Names of the affected records — the only trace of what the delete removed. */
  affectedNames: string[];
  /** `count` requirements that will point at a tag nobody carries. NOT edited. */
  strandedRequirements: number;
  profiles: number;
  /** Whether the orphaned `TagDefinition` was removed. */
  definitionRemoved: boolean;
};

/** Cap on `affectedNames` so a 575-record delete does not return a novel. */
const MAX_REPORTED_NAMES = 200;

export async function deleteTagEverywhere(
  client: TagRenameClient,
  input: { entity: string; tag: Tag; dryRun: boolean },
): Promise<TagDeleteReport>
{
  const { entity, tag, dryRun } = input;
  const collection = tagEntityCollectionMap[entity]!;
  const modelName = tagEntityModelMap[entity]!;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const model = client[modelName] as any;

  const affected = await model.findMany({
    where: { tags: { has: tag } },
    select: { id: true, name: true },
  }) as { id: string; name?: string }[];

  const strandedRequirements = await countStrandedRequirements(client, entity, modelName, tag);
  const profileTargets = await collectProfileTargets(client, entity, tag);

  const report: TagDeleteReport =
  {
    entity,
    tag,
    dryRun,
    records: affected.length,
    affectedNames: affected.slice(0, MAX_REPORTED_NAMES).map(record => record.name ?? record.id),
    strandedRequirements,
    profiles: profileTargets.length,
    definitionRemoved: false,
  };

  if (dryRun) return report;

  if (affected.length > 0)
  {
    await client.$runCommandRaw({
      update: collection,
      updates: [{ q: { tags: tag }, u: { $pull: { tags: tag } }, multi: true }],
    });
  }

  for (const target of profileTargets)
  {
    await client.personalizationProfileRecord.update({
      where: { id: target.id },
      data: { profile: JSON.stringify(target.profile) },
    });
  }

  report.definitionRemoved = await removeOrphanedDefinition(client, entity, tag);

  return report;
}

/**
 * Removes the `TagDefinition` only once the tag is gone from every entity —
 * same rule as the rename, for the same reason: the definition is global while
 * the delete is per entity.
 */
async function removeOrphanedDefinition(client: TagRenameClient, entity: string, tag: Tag): Promise<boolean>
{
  const definitions = client.tagDefinition;
  if (!definitions?.deleteMany) return false;

  for (const [otherEntity, modelName] of Object.entries(tagEntityModelMap))
  {
    if (otherEntity === entity) continue;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const model = client[modelName] as any;

    // A model we cannot count is a model we cannot clear: without proof the tag
    // is gone everywhere, the safe answer is to leave the definition alone. The
    // drift report will surface it either way.
    if (typeof model?.count !== 'function') return false;

    const remaining = await model.count({ where: { tags: { has: tag } } }) as number;
    if (remaining > 0) return false;
  }

  const result = await definitions.deleteMany({ where: { tag } }) as { count?: number };
  invalidateTagFacetLayer();
  return (result?.count ?? 0) > 0;
}

async function countStrandedRequirements(client: TagRenameClient, entity: string, modelName: string, tag: Tag): Promise<number>
{
  if (!requirementBearingEntities.includes(entity)) return 0;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const holders = await (client[modelName] as any).findMany({
    select: { structuredRequirements: true },
  }) as { structuredRequirements: unknown }[];

  let stranded = 0;

  const walk = (node: unknown): void =>
  {
    if (Array.isArray(node)) { node.forEach(walk); return; }
    if (node === null || typeof node !== "object") return;

    for (const [key, value] of Object.entries(node as Record<string, unknown>))
    {
      if (key === "tag" && value === tag) { stranded += 1; continue; }
      walk(value);
    }
  };

  for (const holder of holders) walk(holder.structuredRequirements);
  return stranded;
}

async function collectProfileTargets(client: TagRenameClient, entity: string, tag: Tag)
{
  const contexts = personalizationContextsForEntity(entity);
  if (contexts.length === 0) return [];

  const records = await client.personalizationProfileRecord.findMany({ select: { id: true, profile: true } });

  return records
    .map(record =>
    {
      const parsed = sanitizeProfile(safeParse(record.profile));
      const profile = removeTagFromProfile(parsed, contexts, tag);
      return profile ? { id: record.id, profile } : null;
    })
    .filter((target): target is { id: string; profile: PersonalizationProfile } => target !== null);
}

function removeTagFromProfile(
  profile: PersonalizationProfile,
  contexts: readonly string[],
  tag: Tag,
): PersonalizationProfile | null
{
  let changed = false;

  const strip = (byContext: Record<string, string[] | undefined>): Record<string, string[] | undefined> =>
  {
    const next = { ...byContext };

    for (const context of contexts)
    {
      const tags = next[context];
      if (!tags?.includes(tag)) continue;

      next[context] = tags.filter(existing => existing !== tag);
      changed = true;
    }

    return next;
  };

  const quickTagsByContext = strip(profile.quickTagsByContext);
  const quickExcludeTagsByContext = strip(profile.quickExcludeTagsByContext);

  if (!changed) return null;

  return { ...profile, quickTagsByContext, quickExcludeTagsByContext };
}

function safeParse(value: string): unknown
{
  try { return JSON.parse(value); }
  catch { return {}; }
}
