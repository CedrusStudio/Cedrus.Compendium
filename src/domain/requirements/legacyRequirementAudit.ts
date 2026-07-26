/**
 * Wave 6.1 — pure audit logic for the unfinished legacy→structured requirements
 * migration.
 *
 * Context: `structuredRequirements` is the only requirements model the app reads
 * (Wave 5, Faza 4c) and the legacy `requirements` column was dropped from
 * `schema.prisma` (Faza 4c-full) — but the backfill was never applied to
 * production. Records that still carry only the legacy array therefore render
 * *nothing* in the compendium, even though the data is intact in Mongo.
 *
 * Everything here is Prisma-free and side-effect-free so it can be unit-tested
 * and reused by `scripts/audit-legacy-requirements.ts` and
 * `scripts/backfill-requirements-to-structured.ts`, which read raw Mongo
 * documents (the only way to see a field Prisma no longer knows about).
 */

import {
  type RankedRequirement,
  type RanklessRequirement,
  type Requirement,
  rankedEntriesOf,
} from "@/domain/requirements/Requirement";
import { normalizeRequirementText } from "@/domain/requirements/normalizeRequirementText";
import { requirementTargetLabel } from "@/domain/requirements/formatRequirement";
import {
  extractRequirementValue,
  suggestRequirementMapping,
  type EntityNameOptions,
} from "@/domain/requirements/suggestRequirementMapping";

/** A raw Mongo document, narrowed to the two fields the audit cares about. */
export type RawRequirementsDoc = {
  requirements?: unknown;
  structuredRequirements?: unknown;
};

/**
 * Buckets are decided per legacy TEXT, not per record — the distinction that
 * `Pogromienie` exposed: it has one legacy text ("Większy Fechtunek 2") and one
 * structured entry (`characteristics/strength ≥ 2`), so a record-level "has
 * something structured?" check calls it migrated, while the text it was supposed
 * to preserve is represented nowhere and never reaches the UI.
 *
 * - `orphaned`   — legacy text present, nothing structured at all → invisible.
 * - `partial`    — structured entries exist but do not account for every legacy
 *                  text → the uncovered ones are invisible AND would be
 *                  destroyed by `clear-legacy-requirements`.
 * - `duplicated` — every legacy text is accounted for → legacy is redundant
 *                  leftover, safe to unset.
 * - `clean`      — no legacy text at all.
 */
export type LegacyRequirementBucket = "orphaned" | "partial" | "duplicated" | "clean";

/** Defensive read of the legacy `requirements` array from an untyped raw doc. */
export function readLegacyTexts(doc: RawRequirementsDoc): string[]
{
  if (!Array.isArray(doc.requirements))
  {
    return [];
  }

  return doc.requirements.filter((value): value is string => typeof value === "string" && value.trim().length > 0);
}

/**
 * Defensive read of `structuredRequirements`. Prisma stores it as `Json?`, so it
 * can legitimately be `null`, and hand-edited documents can contain junk — bad
 * entries are dropped rather than throwing, because this runs over the whole
 * library in one pass.
 */
export function readStructuredRequirements(doc: RawRequirementsDoc): Requirement[]
{
  if (!Array.isArray(doc.structuredRequirements))
  {
    return [];
  }

  return doc.structuredRequirements.filter(isRequirement);
}

function isRequirement(value: unknown): value is Requirement
{
  if (typeof value !== "object" || value === null)
  {
    return false;
  }

  const candidate = value as {
    kind?: unknown; text?: unknown; group?: unknown; targetKey?: unknown; value?: unknown;
    options?: unknown; targets?: unknown;
  };

  if (candidate.kind === "rankless")
  {
    return typeof candidate.text === "string";
  }

  if (candidate.kind === "ranked")
  {
    return isRankedShape(candidate);
  }

  // Composite variants (Wave 7). Missing these here would be worse than a type
  // error: the guard would quietly classify every `anyOf` / `sum` entry as junk
  // and drop it, so the backfill would think the record has nothing structured.
  if (candidate.kind === "anyOf")
  {
    return Array.isArray(candidate.options) && candidate.options.every(isRankedShape);
  }

  if (candidate.kind === "sum")
  {
    return typeof candidate.value === "number"
      && Array.isArray(candidate.targets)
      && candidate.targets.every((target) =>
      {
        if (typeof target !== "object" || target === null) return false;
        const entry = target as { group?: unknown; targetKey?: unknown };
        return typeof entry.group === "string" && typeof entry.targetKey === "string";
      });
  }

  return false;
}

function isRankedShape(value: unknown): boolean
{
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as { kind?: unknown; group?: unknown; targetKey?: unknown; value?: unknown };
  return typeof candidate.group === "string"
    && typeof candidate.targetKey === "string"
    && typeof candidate.value === "number";
}

/**
 * Is this legacy text already represented among the structured entries?
 *
 * Two ways to count as covered:
 *  - a `rankless` entry holds it verbatim (the plain 1:1 mirror), or
 *  - a `ranked` entry's target is named inside it — "Siła 3" is covered by
 *    `characteristics/strength ≥ 3`, "Zapał Wojownika 2" by
 *    `perks/Zapał Wojownika ≥ 2`.
 *
 * Deliberately ignores the rank when matching a `ranked` entry: a wrong *value*
 * still displays the right requirement, so the text is not lost. A wrong
 * *target* is a different requirement entirely and leaves the text uncovered —
 * which is exactly the `Pogromienie` case.
 */
export function isLegacyTextCovered(text: string, structured: readonly Requirement[]): boolean
{
  const normalized = normalizeRequirementText(text);

  return structured.some((requirement) =>
  {
    if (requirement.kind === "rankless")
    {
      return requirement.text === normalized;
    }

    // `rankedEntriesOf` also looks inside an `anyOf`, so "Moc 2 lub Więź 2"
    // counts as covering the legacy text "Moc 2". A `sum` contributes no
    // targets and therefore never covers a text on its own.
    return rankedEntriesOf(requirement)
      .some((entry) => normalized.includes(normalizeRequirementText(requirementTargetLabel(entry))));
  });
}

/** The legacy texts that no structured entry accounts for — what the backfill must add. */
export function findUncoveredLegacyTexts(doc: RawRequirementsDoc): string[]
{
  const structured = readStructuredRequirements(doc);
  return readLegacyTexts(doc).filter((text) => !isLegacyTextCovered(text, structured));
}

export function classifyLegacyRecord(doc: RawRequirementsDoc): LegacyRequirementBucket
{
  if (readLegacyTexts(doc).length === 0)
  {
    return "clean";
  }

  if (readStructuredRequirements(doc).length === 0)
  {
    return "orphaned";
  }

  return findUncoveredLegacyTexts(doc).length > 0 ? "partial" : "duplicated";
}

/** Normalize + drop blanks + wrap each remaining text as a `rankless` requirement. */
export function toRanklessRequirements(texts: readonly string[]): RanklessRequirement[]
{
  return texts
    .map((text) => normalizeRequirementText(text))
    .filter((text) => text.length > 0)
    .map((text) => ({ kind: "rankless", text }));
}

/**
 * The structured array a record should end up with: whatever it already has,
 * plus a `rankless` entry for every legacy text nothing accounts for. Returns
 * `null` when there is nothing to add, so callers can skip the write.
 *
 * Appending (rather than replacing when empty, as the first cut of this script
 * did) is the whole point: a record can hold a structured entry AND still be
 * missing a legacy requirement.
 */
export function planBackfill(doc: RawRequirementsDoc): Requirement[] | null
{
  const missing = toRanklessRequirements(findUncoveredLegacyTexts(doc));
  if (missing.length === 0)
  {
    return null;
  }

  return [...readStructuredRequirements(doc), ...missing];
}

export function needsBackfill(doc: RawRequirementsDoc): boolean
{
  return planBackfill(doc) !== null;
}

/**
 * Why a stored `ranked` requirement looks suspicious next to its legacy wording.
 * - `target-differs` — no legacy text on the record names this requirement's
 *   target. Real example from production: `Pogromienie` reads
 *   "Większy Fechtunek 2" but stores `characteristics/strength ≥ 2`, while
 *   *fechtunek* is `attributes/fencing`. Hand-authored through the editor, not
 *   machine-generated — no mapping script has ever run against that database.
 * - `value-differs`  — the right target, but a rank the text does not support.
 */
export type MappingFindingReason = "target-differs" | "value-differs";

export type MappingFinding = {
  reason: MappingFindingReason;
  /** The one suspicious `ranked` entry. */
  stored: RankedRequirement;
  /** The record's legacy wording, as context for the reviewer. */
  legacyTexts: string[];
  /**
   * What the matcher reads out of the unexplained legacy text, if anything.
   * May be an `anyOf` — a bare "Moc 2" is satisfied by either source of magic.
   */
  suggested: Requirement | null;
};

/**
 * Cross-checks stored `ranked` requirements against the legacy wording they were
 * derived from and reports the ones a human should look at in
 * `/admin/requirements`. Reporting only — it never rewrites data.
 *
 * Driven by the STORED entries rather than the texts on purpose. A text-driven
 * pass goes quiet as soon as the backfill adds a verbatim `rankless` mirror,
 * which would hide the wrong mapping precisely on the records that just got
 * repaired. Asking "does any legacy text name this target?" survives that.
 */
export function auditRankedMappings(doc: RawRequirementsDoc, entityNames: EntityNameOptions = {}): MappingFinding[]
{
  const legacyTexts = readLegacyTexts(doc);
  // Flattened, so a wrong target hiding inside an `anyOf` is audited too.
  const ranked = readStructuredRequirements(doc).flatMap(rankedEntriesOf);

  // No legacy wording to compare against, or nothing ranked to be wrong about.
  if (legacyTexts.length === 0 || ranked.length === 0)
  {
    return [];
  }

  const findings: MappingFinding[] = [];

  for (const requirement of ranked)
  {
    const label = normalizeRequirementText(requirementTargetLabel(requirement));
    const naming = legacyTexts.filter((text) => normalizeRequirementText(text).includes(label));

    if (naming.length === 0)
    {
      // Suggest from a text that nothing explains — that is the one this entry
      // was probably meant to be.
      const unexplained = legacyTexts.find((text) => !isLegacyTextCovered(text, ranked)) ?? legacyTexts[0]!;
      findings.push({
        reason: "target-differs",
        stored: requirement,
        legacyTexts,
        suggested: suggestRequirementMapping(unexplained, entityNames),
      });
      continue;
    }

    const supportsValue = naming.some((text) => (extractRequirementValue(normalizeRequirementText(text)) ?? 1) === requirement.value);

    if (!supportsValue)
    {
      findings.push({
        reason: "value-differs",
        stored: requirement,
        legacyTexts: naming,
        suggested: suggestRequirementMapping(naming[0]!, entityNames),
      });
    }
  }

  return findings;
}
