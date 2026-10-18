"use client";

import type { Requirement } from "@/domain/requirements/Requirement";
import { formatRequirement } from "@/domain/requirements/formatRequirement";
import { checkRequirement } from "@/domain/requirements/checkRequirement";
import { useMainCharacter } from "@/application/common/requirements/useMainCharacter";
import { useOptionalCompendiumCharacterScope } from '@/application/compendium/character-scope/CompendiumCharacterScopeProvider';
import { displayedText as t } from '@/common/translations';

type RequirementsViewProps =
{
    entityWithRequirements: { structuredRequirements?: Requirement[] | null };
    useCompendiumCharacter?: boolean;
};

const BASE_CHIP = "text-sm border rounded-full px-2 py-1";

/**
 * Renders an entity's requirements from `structuredRequirements` (the single
 * source of truth). `rankless` entries show as their text, `ranked` as
 * "target ≥ value". An explicitly scoped compendium character takes priority
 * over the main character (green = met, red = not). `rankless`
 * stays neutral, since free-text satisfaction can't be determined reliably.
 */
export default function RequirementsView({ entityWithRequirements, useCompendiumCharacter = false }: RequirementsViewProps)
{
  const structuredRequirements = entityWithRequirements.structuredRequirements ?? [];
  const scope = useOptionalCompendiumCharacterScope();
  const hasScopedCharacter = !!(useCompendiumCharacter && scope?.selectedCharacterId);
  const mainCharacter = useMainCharacter(!hasScopedCharacter);
  const evaluationCharacter = hasScopedCharacter ? scope?.character : mainCharacter;

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
          const met = evaluationCharacter && decidable
            ? checkRequirement(requirement, evaluationCharacter)
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
              ? `${evaluationCharacter?.name}: ${t.compendium_requirement_met}`
              : `${evaluationCharacter?.name}: ${t.compendium_requirement_unmet}`;

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
