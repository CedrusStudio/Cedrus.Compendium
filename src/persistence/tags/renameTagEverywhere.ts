/**
 * The write side of a tag rename (Wave 9.0).
 *
 * Three stores hold a tag name and all three have to move together:
 *  1. `tags: String[]` on the entity;
 *  2. `tag` inside `structuredRequirements` (`count` requirements, Wave 8.1);
 *  3. `quickTagsByContext` / `quickExcludeTagsByContext` in every user's profile.
 *
 * The entity sweep runs as TWO raw Mongo commands regardless of how many records
 * match, instead of the previous `Promise.all` over N `update` calls. At 575
 * records (`ofensywne`) that difference is not performance — it is whether a
 * partial failure can leave half the library renamed, with both names visible in
 * the filter and no way to tell which one is real.
 *
 * Two commands rather than one because a positional `$set` on a record that
 * already carries BOTH names would produce a duplicate entry. Merges are pulled
 * first, then the plain swaps are set.
 */

import type { Tag } from "@/domain/Tag";
import {
  personalizationContextsForEntity,
  renameTagInProfile,
  renameTagInRequirements,
  type TagRenameReport,
} from "@/domain/tags/renameTagOccurrences";
import { requirementBearingEntities, tagEntityCollectionMap, tagEntityModelMap } from "@/lib/tagEntityModels";
import { invalidateTagFacetLayer } from "@/persistence/tags/tagFacetLayer";
import { sanitizeProfile } from "@/common/personalization/personalizationProfile";

/** Minimal surface we need from the Prisma client — keeps this unit-testable. */
export type TagRenameClient =
{
  $runCommandRaw: (command: Record<string, unknown>) => Promise<unknown>;
  personalizationProfileRecord: {
    findMany: (args: unknown) => Promise<{ id: string; profile: string }[]>;
    update: (args: unknown) => Promise<unknown>;
  };
  tagDefinition?: {
    findFirst: (args: unknown) => Promise<{ tag: string; formerNames: string[] } | null>;
    update: (args: unknown) => Promise<unknown>;
    deleteMany?: (args: unknown) => Promise<unknown>;
  };
  [model: string]: unknown;
};

type RequirementHolder = { id: string; structuredRequirements: unknown };

export type TagRenameInput =
{
  entity: string;
  oldTag: Tag;
  newTag: Tag;
  dryRun: boolean;
};

export async function renameTagEverywhere(client: TagRenameClient, input: TagRenameInput): Promise<TagRenameReport>
{
  const { entity, oldTag, newTag, dryRun } = input;
  const collection = tagEntityCollectionMap[entity]!;
  const modelName = tagEntityModelMap[entity]!;

  const { records, merged } = await countEntityRecords(client, modelName, oldTag, newTag);
  const requirementTargets = await collectRequirementTargets(client, entity, modelName, oldTag, newTag);
  const profileTargets = await collectProfileTargets(client, entity, oldTag, newTag);

  const report: TagRenameReport =
  {
    entity,
    oldTag,
    newTag,
    dryRun,
    records,
    merged,
    requirementReferences: requirementTargets.reduce((total, target) => total + target.occurrences, 0),
    profiles: profileTargets.length,
  };

  if (dryRun) return report;

  // Order matters: pull the duplicates before setting, or the positional update
  // below would append `newTag` next to an identical entry.
  if (merged > 0)
  {
    await client.$runCommandRaw({
      update: collection,
      updates: [{ q: { $and: [{ tags: oldTag }, { tags: newTag }] }, u: { $pull: { tags: oldTag } }, multi: true }],
    });
  }

  if (records - merged > 0)
  {
    await client.$runCommandRaw({
      update: collection,
      updates: [{
        q: { tags: oldTag },
        u: { $set: { "tags.$[element]": newTag } },
        multi: true,
        arrayFilters: [{ element: oldTag }],
      }],
    });
  }

  for (const target of requirementTargets)
  {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (client[modelName] as any).update({
      where: { id: target.id },
      data: { structuredRequirements: target.value },
    });
  }

  for (const target of profileTargets)
  {
    await client.personalizationProfileRecord.update({
      where: { id: target.id },
      data: { profile: JSON.stringify(target.profile) },
    });
  }

  report.definitionMoved = await syncTagDefinition(client, entity, oldTag, newTag);

  return report;
}

/**
 * Keeps the facet layer in step with a rename (Wave 9.2).
 *
 * A rename is PER ENTITY, a `TagDefinition` is global — so the definition may
 * only follow when the old name is gone everywhere. Renaming `ofensywne` on
 * Maneuvers while Perks still carry it would otherwise drag the definition away
 * from the records that still use it.
 *
 * When the old name survives elsewhere the definition is left alone and the
 * drift report (9.6) surfaces it. That degrades visibly, not silently: the tag
 * simply shows up in the "Pozostałe" bucket until an admin assigns it.
 */
async function syncTagDefinition(client: TagRenameClient, entity: string, oldTag: Tag, newTag: Tag): Promise<boolean>
{
  const definitions = client.tagDefinition;
  if (!definitions) return false;

  const existing = await definitions.findFirst({ where: { tag: oldTag } });
  if (!existing) return false;

  for (const [otherEntity, modelName] of Object.entries(tagEntityModelMap))
  {
    if (otherEntity === entity) continue;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const model = client[modelName] as any;

    // A model we cannot count is a model we cannot clear: without proof the tag
    // is gone everywhere, the safe answer is to leave the definition alone. The
    // drift report will surface it either way.
    if (typeof model?.count !== 'function') return false;

    const remaining = await model.count({ where: { tags: { has: oldTag } } }) as number;
    if (remaining > 0) return false;
  }

  await definitions.update({
    where: { tag: oldTag },
    data: { tag: newTag, formerNames: [...(existing.formerNames ?? []), oldTag] },
  });

  invalidateTagFacetLayer();
  return true;
}

async function countEntityRecords(client: TagRenameClient, modelName: string, oldTag: Tag, newTag: Tag)
{
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const model = client[modelName] as any;

  const affected = await model.findMany({
    where: { tags: { has: oldTag } },
    select: { id: true, tags: true },
  }) as { id: string; tags: string[] }[];

  return {
    records: affected.length,
    merged: affected.filter(record => record.tags.includes(newTag)).length,
  };
}

async function collectRequirementTargets(client: TagRenameClient, entity: string, modelName: string, oldTag: Tag, newTag: Tag)
{
  if (!requirementBearingEntities.includes(entity)) return [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const model = client[modelName] as any;

  const holders = await model.findMany({
    select: { id: true, structuredRequirements: true },
  }) as RequirementHolder[];

  return holders
    .map(holder =>
    {
      const { value, occurrences } = renameTagInRequirements(holder.structuredRequirements, oldTag, newTag);
      return { id: holder.id, value, occurrences };
    })
    .filter(target => target.occurrences > 0);
}

async function collectProfileTargets(client: TagRenameClient, entity: string, oldTag: Tag, newTag: Tag)
{
  const contexts = personalizationContextsForEntity(entity);
  if (contexts.length === 0) return [];

  const records = await client.personalizationProfileRecord.findMany({ select: { id: true, profile: true } });

  return records
    .map(record =>
    {
      const parsed = sanitizeProfile(safeParse(record.profile));
      const profile = renameTagInProfile(parsed, contexts, oldTag, newTag);
      return profile ? { id: record.id, profile } : null;
    })
    .filter((target): target is { id: string; profile: ReturnType<typeof sanitizeProfile> } => target !== null);
}

function safeParse(value: string): unknown
{
  try
  {
    return JSON.parse(value);
  }
  catch
  {
    return {};
  }
}
