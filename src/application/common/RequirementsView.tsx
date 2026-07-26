"use client";

import type { Requirement } from "@/domain/requirements/Requirement";
import { formatRequirement } from "@/domain/requirements/formatRequirement";
import { checkRequirement } from "@/domain/requirements/checkRequirement";
import { useMainCharacter } from "@/application/common/requirements/useMainCharacter";

type RequirementsViewProps =
{
    entityWithRequirements: { structuredRequirements?: Requirement[] | null };
};

const BASE_CHIP = "text-sm border rounded-full px-2 py-1";

/**
 * Renders an entity's requirements from `structuredRequirements` (the single
 * source of truth). `rankless` entries show as their text, `ranked` as
 * "target ≥ value". When a main character is set, `ranked` chips are colored by
 * whether that character satisfies them (green = met, red = not) — `rankless`
 * stays neutral, since free-text satisfaction can't be determined reliably.
 */
export default function RequirementsView({ entityWithRequirements }: RequirementsViewProps)
{
  const structuredRequirements = entityWithRequirements.structuredRequirements ?? [];
  const mainCharacter = useMainCharacter();

  if (structuredRequirements.length === 0)
  {
    return null;
  }

  return (
    // ROADMAP 6.3 — same alignment rule as `SummaryView` right above it, so the
    // requirement chips don't sit centred under a left-aligned name on desktop.
    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-1">
      {
        structuredRequirements.map((requirement, index) => {
          // `rankless` stays neutral: free-text satisfaction can't be determined
          // reliably. Everything else is decidable, including a whole `anyOf`
          // (green as soon as ONE option is met) and a `sum`.
          const decidable = requirement.kind !== "rankless";
          const met = mainCharacter && decidable
            ? checkRequirement(requirement, mainCharacter)
            : undefined;

          const color = met === true
            ? "border-green-500/60 text-green-600 dark:text-green-500"
            : met === false
              ? "border-destructive/60 text-destructive"
              : decidable
                ? "border-primary/60 text-primary"
                : "";

          const title = met === undefined
            ? undefined
            : met
              ? "Twoja główna postać spełnia to wymaganie"
              : "Twoja główna postać nie spełnia tego wymagania";

          return (
            <span key={`req:${index}:${formatRequirement(requirement)}`} className={`${BASE_CHIP} ${color}`} title={title}>
              {formatRequirement(requirement)}
            </span>
          );
        })
      }
    </div>
  );
};
