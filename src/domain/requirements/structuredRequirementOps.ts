/**
 * Bulk edit/remove operations on a record's `structuredRequirements`, keyed by
 * structured equality (Wave 5, admin structured management). Pure + tested.
 */

import { type Requirement } from "@/domain/requirements/Requirement";
import { requirementsEqual } from "@/domain/requirements/applyStructuredRequirement";

/**
 * The identity projection of a requirement, used as a Mongo `$elemMatch` by the
 * admin edit/delete endpoints. Exhaustive on purpose: the previous
 * "rankless or else assume ranked" shortcut would have matched an `anyOf` on
 * fields it does not have, i.e. matched nothing, i.e. reported success while
 * changing zero records.
 */
export function requirementElemMatch(requirement: Requirement): Record<string, unknown>
{
  switch (requirement.kind)
  {
    case "rankless":
      return { kind: "rankless", text: requirement.text };
    case "ranked":
      return { kind: "ranked", group: requirement.group, targetKey: requirement.targetKey, value: requirement.value };
    case "anyOf":
      return { kind: "anyOf", options: requirement.options };
    case "sum":
      return { kind: "sum", targets: requirement.targets, value: requirement.value };
    case "count":
      return {
        kind: "count",
        groups: requirement.groups,
        ...(requirement.tag === undefined ? {} : { tag: requirement.tag }),
        ...(requirement.minGrade === undefined ? {} : { minGrade: requirement.minGrade }),
        value: requirement.value,
      };
  }
}

export function dedupeRequirements(list: readonly Requirement[]): Requirement[]
{
  const result: Requirement[] = [];
  for (const entry of list)
  {
    if (!result.some((existing) => requirementsEqual(existing, entry)))
    {
      result.push(entry);
    }
  }
  return result;
}

/**
 * Replace every entry equal to `original` with one OR MORE replacements, then
 * dedupe.
 *
 * Several replacements let the admin split a compound requirement — the array
 * itself is already a conjunction, so "Ilość postaw i manewrów fizycznych 3"
 * becomes two independent entries rather than needing an `allOf` variant that
 * would duplicate what the array already means.
 */
export function replaceStructuredRequirement(
  list: readonly Requirement[] | null | undefined,
  original: Requirement,
  replacement: Requirement | readonly Requirement[],
): Requirement[]
{
  const replacements = Array.isArray(replacement) ? replacement : [replacement as Requirement];
  const mapped = (list ?? []).flatMap((entry) => (requirementsEqual(entry, original) ? replacements : [entry]));
  return dedupeRequirements(mapped);
}

/** Remove every entry equal to `target`. */
export function removeStructuredRequirement(
  list: readonly Requirement[] | null | undefined,
  target: Requirement,
): Requirement[]
{
  return (list ?? []).filter((entry) => !requirementsEqual(entry, target));
}
