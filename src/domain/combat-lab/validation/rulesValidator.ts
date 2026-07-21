/**
 * Rules Validator: static checks over maneuver definitions — catches "dead
 * mechanics", broken references and nonsensical effects before they ever reach
 * a simulation. Pure domain, deterministic; no simulation needed.
 *
 * Some doc-listed checks (infinite combos, dominant loops) are dynamic and would
 * need simulation traces — those are left for a future dynamic pass. This module
 * covers the static, structural ones.
 */

import type { ManeuverDefinition } from "@/domain/combat-lab/effects/ManeuverDefinition";
import type { Effect } from "@/domain/combat-lab/effects/Effect";
import { flattenEffects } from "@/domain/combat-lab/effects/Effect";
import { maneuverDefinitionExtrasSchema } from "@/domain/combat-lab/effects/effectSchema";

export type IssueSeverity = "error" | "warning" | "info";

export type ValidationIssue =
{
  severity: IssueSeverity;
  code: string;
  message: string;
  maneuverId?: string;
  maneuverName?: string;
};

export type ValidationContext =
{
  /** Buff-profile ids available to reference (the caster's library). */
  buffProfileIds?: Set<string>;
};

export function validateManeuvers(maneuvers: ManeuverDefinition[], context: ValidationContext = {}): ValidationIssue[]
{
  const issues: ValidationIssue[] = [];

  const nameCounts = new Map<string, number>();
  for (const m of maneuvers) nameCounts.set(m.name, (nameCounts.get(m.name) ?? 0) + 1);
  for (const [name, count] of nameCounts)
  {
    if (count > 1)
    {
      issues.push({ severity: "warning", code: "duplicate-name", message: `Zduplikowana nazwa manewru „${name}" (${count}×) — myląca dla strategii skryptowanej i grafu kombinacji.`, maneuverName: name });
    }
  }

  for (const maneuver of maneuvers)
  {
    const tag = { maneuverId: maneuver.id, maneuverName: maneuver.name };

    const parsed = maneuverDefinitionExtrasSchema.safeParse({ effects: maneuver.effects, hardRequirements: maneuver.hardRequirements, cost: maneuver.cost });
    if (!parsed.success)
    {
      issues.push({ severity: "error", code: "schema", message: `Nieprawidłowe dane manewru: ${parsed.error.issues[0]?.message ?? "błąd schematu"}.`, ...tag });
    }

    if (maneuver.effects.length === 0)
    {
      issues.push({ severity: "warning", code: "no-effects", message: "Martwa mechanika: manewr nie ma żadnych efektów (nic nie robi w silniku).", ...tag });
    }

    if (typeof maneuver.cooldown === "number" && maneuver.cooldown < 0)
    {
      issues.push({ severity: "error", code: "negative-cooldown", message: "Ujemny czas odnowienia.", ...tag });
    }

    for (const effect of flattenEffects(maneuver.effects))
    {
      collectEffectIssues(effect, maneuver, context, issues);
    }
  }

  return sortBySeverity(issues);
}

function collectEffectIssues(effect: Effect, maneuver: ManeuverDefinition, context: ValidationContext, issues: ValidationIssue[]): void
{
  const tag = { maneuverId: maneuver.id, maneuverName: maneuver.name };

  switch (effect.type)
  {
    case "chance":
      if (effect.then.length === 0)
      {
        issues.push({ severity: "warning", code: "empty-chance", message: `Efekt „chance ${effect.chance}%" nie ma żadnych zagnieżdżonych efektów (nic się nie dzieje).`, ...tag });
      }
      break;
    case "status":
    case "control":
    case "buff":
    case "debuff":
      if (effect.duration <= 0)
      {
        issues.push({ severity: "warning", code: "zero-duration", message: `Efekt „${effect.type}" ma zerowy czas trwania — nie zadziała.`, ...tag });
      }
      if ((effect.type === "buff" || effect.type === "debuff") && context.buffProfileIds && !context.buffProfileIds.has(effect.profile.profileId))
      {
        issues.push({ severity: "error", code: "missing-profile", message: `Efekt „${effect.type}" odwołuje się do nieistniejącego profilu buffów (${effect.profile.profileId}).`, ...tag });
      }
      break;
    default:
      break;
  }
}

const SEVERITY_ORDER: Record<IssueSeverity, number> = { error: 0, warning: 1, info: 2 };

function sortBySeverity(issues: ValidationIssue[]): ValidationIssue[]
{
  return [...issues].sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity] || (a.maneuverName ?? "").localeCompare(b.maneuverName ?? ""));
}

export function countBySeverity(issues: ValidationIssue[]): Record<IssueSeverity, number>
{
  return issues.reduce(
    (acc, issue) => { acc[issue.severity] += 1; return acc; },
    { error: 0, warning: 0, info: 0 } as Record<IssueSeverity, number>,
  );
}
