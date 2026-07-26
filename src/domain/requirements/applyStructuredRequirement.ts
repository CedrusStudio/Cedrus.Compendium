/**
 * Migrate one free-text requirement on a single record to a structured one
 * (Wave 5, admin structuring tool). Pure so the API route stays thin and it can
 * be unit-tested.
 *
 * On a record that carries `requirementText` in its legacy `requirements`:
 *  - remove that exact text from `requirements` (the migration — the text is now
 *    represented structurally);
 *  - drop the rankless "mirror" of that text from `structuredRequirements`
 *    (the backfill put one there);
 *  - add the new structured `requirement`, unless an equal one already exists.
 *
 * Idempotent: re-applying with the text already gone is a no-op-ish (text filter
 * removes nothing, dedup prevents a second copy).
 */

import { type Requirement } from "@/domain/requirements/Requirement";
import { normalizeRequirementText } from "@/domain/requirements/normalizeRequirementText";

export type StructuredRequirementRecord = {
  requirements: string[];
  structuredRequirements: Requirement[];
};

export function requirementsEqual(a: Requirement, b: Requirement): boolean
{
  if (a.kind === "rankless" && b.kind === "rankless")
  {
    return normalizeRequirementText(a.text) === normalizeRequirementText(b.text);
  }

  if (a.kind === "ranked" && b.kind === "ranked")
  {
    return a.group === b.group && a.targetKey === b.targetKey && a.value === b.value;
  }

  // Composite variants (Wave 7) compare element-wise and order-sensitively.
  // Without these the admin panel could never match — and therefore never edit
  // or delete — an `anyOf` or `sum` entry.
  if (a.kind === "anyOf" && b.kind === "anyOf")
  {
    return a.options.length === b.options.length
      && a.options.every((option, index) => requirementsEqual(option, b.options[index]!));
  }

  if (a.kind === "sum" && b.kind === "sum")
  {
    return a.value === b.value
      && a.targets.length === b.targets.length
      && a.targets.every((target, index) => target.group === b.targets[index]!.group && target.targetKey === b.targets[index]!.targetKey);
  }

  return false;
}

export function applyStructuredRequirement(
  record: { requirements?: string[] | null; structuredRequirements?: Requirement[] | null },
  requirementText: string,
  requirement: Requirement,
): StructuredRequirementRecord
{
  const normalizedText = normalizeRequirementText(requirementText);

  // Only a `ranked` result migrates the legacy text away — it now has a
  // structured (displayed) representation. A `rankless` result keeps the legacy
  // text, since rankless mirrors are not displayed and removing it would hide
  // the requirement entirely (that case is really just a text rename).
  const requirements = requirement.kind === "ranked"
    ? (record.requirements ?? []).filter((text) => text !== requirementText)
    : (record.requirements ?? []);

  const withoutMirror = (record.structuredRequirements ?? []).filter(
    (entry) => !(entry.kind === "rankless" && normalizeRequirementText(entry.text) === normalizedText),
  );

  const alreadyPresent = withoutMirror.some((entry) => requirementsEqual(entry, requirement));
  const structuredRequirements = alreadyPresent ? withoutMirror : [...withoutMirror, requirement];

  return { requirements, structuredRequirements };
}
