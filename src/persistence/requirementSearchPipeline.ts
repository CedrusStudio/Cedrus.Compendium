/**
 * Builds the MongoDB aggregation pipeline for the Wave 5 compendium requirement
 * filter (see `searchEntity`). Pure and Prisma-free so it can be unit-tested.
 *
 * Prisma's typed `findMany` cannot express a value comparison inside the
 * `structuredRequirements` JSON array, so the filtered case drops to
 * `aggregateRaw`. This module translates the same `search`/`exclude`/`sort`/
 * offset inputs the normal search uses into a `$match` (+ `$sort`/`$skip`/
 * `$limit`), and adds an `$elemMatch` for each requirement filter.
 *
 * Wave 6.2: several filters can be applied at once and are combined with AND.
 * Each one becomes its OWN `$elemMatch` rather than extra keys inside a shared
 * one — that is what makes "satisfies requirement A *and* requirement B" match
 * two different array entries instead of demanding a single entry be both.
 */

import type { RequirementSearchFilter, SearchValueInput } from "@/common/global/SearchPayloads";
import { normalizeRequirementText } from "@/domain/requirements/normalizeRequirementText";

export type MongoStage = Record<string, unknown>;

export type RequirementPipelineInput = {
  search?: { [key: string]: SearchValueInput };
  exclude?: { [key: string]: SearchValueInput };
  sort?: Array<{ [key: string]: "asc" | "desc" }>;
  offset?: { pageNumber: number; pageSize: number };
  /** AND-ed together. Callers normalize via `collectRequirementFilters`. */
  requirementFilters: RequirementSearchFilter[];
  /**
   * Wave 10.3: ready-made `$match` fragments, AND-ed with everything else. The
   * tag-facet conditions arrive this way — already rendered by
   * `toMongoTagConditions`, so this path and the typed Prisma path are two
   * renderings of ONE resolved condition list rather than two implementations.
   */
  extraConditions?: MongoStage[];
};

function escapeRegex(value: string): string
{
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** The `id` field is stored as Mongo's `_id`; every other field keeps its name. */
function mongoField(key: string): string
{
  return key === "id" ? "_id" : key;
}

function isAnyOf(value: SearchValueInput): value is { anyOf: (string | number | boolean)[] }
{
  return typeof value === "object" && value !== null && "anyOf" in value && Array.isArray((value as { anyOf: unknown }).anyOf);
}

function includeCondition(key: string, value: SearchValueInput): MongoStage | null
{
  const field = mongoField(key);
  if (value === undefined || value === null) return null;
  if (typeof value === "string") return value.trim() === "" ? null : { [field]: { $regex: escapeRegex(value), $options: "i" } };
  if (typeof value === "number" || typeof value === "boolean") return { [field]: value };
  if (Array.isArray(value)) return value.length > 0 ? { [field]: { $all: value } } : null;
  if (isAnyOf(value)) return value.anyOf.length > 0 ? { [field]: { $in: value.anyOf } } : null;
  return null;
}

function excludeCondition(key: string, value: SearchValueInput): MongoStage | null
{
  const field = mongoField(key);
  if (value === undefined || value === null) return null;
  if (typeof value === "string") return value.trim() === "" ? null : { [field]: { $not: { $regex: escapeRegex(value), $options: "i" } } };
  if (typeof value === "number" || typeof value === "boolean") return { [field]: { $ne: value } };
  if (Array.isArray(value)) return value.length > 0 ? { [field]: { $nin: value } } : null;
  if (isAnyOf(value)) return value.anyOf.length > 0 ? { [field]: { $nin: value.anyOf } } : null;
  return null;
}

function requirementCondition(filter: RequirementSearchFilter): MongoStage
{
  if (filter.kind === "text")
  {
    // Unstructured requirement: case-insensitive substring against the `rankless`
    // structured requirements (the source of truth). The stored text is
    // normalized, so normalize the query fragment too (collapse whitespace).
    // Free text can also sit inside an alternative ("Lekka lub średnia zbroja"),
    // so both placements are searched — same reason as the ranked branch below.
    const fragment = normalizeRequirementText(filter.text);
    const text = { text: { $regex: escapeRegex(fragment), $options: "i" } };

    return {
      $or: [
        { structuredRequirements: { $elemMatch: { kind: "rankless", ...text } } },
        { structuredRequirements: { $elemMatch: { kind: "anyOf", options: { $elemMatch: { kind: "rankless", ...text } } } } },
      ],
    };
  }

  const target = { group: filter.group, targetKey: filter.targetKey, value: { $lte: filter.maxValue } };

  // Wave 7.7: a `ranked` target can sit either directly in the array or inside
  // an `anyOf`'s options. Matching only the first shape would silently drop
  // every entity whose requirement is an alternative — no error, just missing
  // rows — so both readings are OR-ed.
  return {
    $or: [
      { structuredRequirements: { $elemMatch: { kind: "ranked", ...target } } },
      { structuredRequirements: { $elemMatch: { kind: "anyOf", options: { $elemMatch: { kind: "ranked", ...target } } } } },
    ],
  };
}

export function buildRequirementSearchPipeline(input: RequirementPipelineInput): MongoStage[]
{
  const conditions: MongoStage[] = [];

  for (const [key, value] of Object.entries(input.search ?? {}))
  {
    const condition = includeCondition(key, value);
    if (condition) conditions.push(condition);
  }

  for (const [key, value] of Object.entries(input.exclude ?? {}))
  {
    const condition = excludeCondition(key, value);
    if (condition) conditions.push(condition);
  }

  for (const filter of input.requirementFilters)
  {
    conditions.push(requirementCondition(filter));
  }

  conditions.push(...(input.extraConditions ?? []));

  // `{ $and: [] }` is rejected by Mongo, so an empty condition set has to become
  // a match-everything stage. In practice `searchEntity` only takes this path
  // when there is at least one requirement filter.
  const match: MongoStage = conditions.length === 0
    ? {}
    : conditions.length === 1 ? conditions[0]! : { $and: conditions };

  const pipeline: MongoStage[] = [{ $match: match }];

  if (input.sort && input.sort.length > 0)
  {
    const sortSpec: Record<string, 1 | -1> = {};
    for (const entry of input.sort)
    {
      for (const [field, direction] of Object.entries(entry))
      {
        sortSpec[mongoField(field)] = direction === "desc" ? -1 : 1;
      }
    }
    pipeline.push({ $sort: sortSpec });
  }

  if (input.offset)
  {
    const skip = Math.max(0, (input.offset.pageNumber - 1) * input.offset.pageSize);
    if (skip > 0) pipeline.push({ $skip: skip });
    pipeline.push({ $limit: input.offset.pageSize });
  }

  return pipeline;
}
