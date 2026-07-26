/**
 * Human-readable rendering of a structured requirement (Wave 5).
 * - `rankless` → its text as-is.
 * - `ranked`   → "<target> ≥ <value>", where target is the Polish stat label
 *   (for characteristics/attributes) or the entity name (for maneuvers/…).
 */

import { SKILLS } from "@/domain/characters/statistics/skills";
import {
  DERIVED_TARGETS,
  ENTITY_GROUP_LABELS,
  EQUIPMENT_TARGETS,
  type RankedRequirement,
  type Requirement,
  type StatisticTarget,
  isDerivedGroup,
  isEquipmentGroup,
  isPowerGroup,
  isStatisticGroup,
} from "@/domain/requirements/Requirement";

/** Polish labels for Power types — the stored keys are `moc` / `wiez`. */
const POWER_TYPE_LABELS: Record<string, string> = { moc: "Moc", wiez: "Więź" };

function statisticLabel(group: StatisticTarget["group"], targetKey: string): string
{
  return SKILLS.find(([g, key]) => g === group && key === targetKey)?.[2] ?? targetKey;
}

/**
 * The human-facing name of a `ranked` requirement's target: the Polish stat
 * label for characteristics/attributes, the Polish Power type for `powers`, the
 * entity or Talent `name` for everything else. Extracted so the audit tooling
 * (Wave 6.1) can match stored requirements against their legacy free-text
 * wording without duplicating this lookup.
 */
export function requirementTargetLabel(requirement: RankedRequirement): string
{
  if (isStatisticGroup(requirement.group))
  {
    return statisticLabel(requirement.group, requirement.targetKey);
  }

  if (isPowerGroup(requirement.group))
  {
    return POWER_TYPE_LABELS[requirement.targetKey] ?? requirement.targetKey;
  }

  if (isDerivedGroup(requirement.group))
  {
    return DERIVED_TARGETS.find((target) => target.key === requirement.targetKey)?.label ?? requirement.targetKey;
  }

  if (isEquipmentGroup(requirement.group))
  {
    return EQUIPMENT_TARGETS.find((target) => target.key === requirement.targetKey)?.label ?? requirement.targetKey;
  }

  return requirement.targetKey;
}

/**
 * Equipment reads as a phrase, not as a number: „co najmniej średnia tarcza"
 * rather than „tarcza ≥ 3", which told a reviewer nothing about what they were
 * approving. Marek confirmed the scales are thresholds — „co najmniej średnia
 * tarcza" means średnia OR duża OR pawęż.
 */
function formatEquipment(requirement: RankedRequirement): string
{
  const target = EQUIPMENT_TARGETS.find((entry) => entry.key === requirement.targetKey);
  if (!target)
  {
    return `${requirement.targetKey} ≥ ${requirement.value}`;
  }

  const tier = target.tierLabels?.[requirement.value - 1];
  return tier ? `co najmniej ${tier} ${target.label}` : target.label;
}

export function formatRequirement(requirement: Requirement): string
{
  // Exhaustive switch + `never` guard (Wave 7.0) — a new variant must not be
  // able to slip through and get rendered as something it is not.
  switch (requirement.kind)
  {
    case "rankless":
      return requirement.text;
    case "ranked":
    {
      if (isEquipmentGroup(requirement.group)) return formatEquipment(requirement);

      // A yes/no property reads as itself; „walka dwiema broniami ≥ 1" is noise.
      const derived = isDerivedGroup(requirement.group)
        ? DERIVED_TARGETS.find((target) => target.key === requirement.targetKey)
        : undefined;
      if (derived?.boolean) return derived.label;

      return `${requirementTargetLabel(requirement)} ≥ ${requirement.value}`;
    }
    case "anyOf":
      return requirement.options.map(formatRequirement).join(" lub ");
    case "sum":
      return `${requirement.targets.map((target) => statisticLabel(target.group, target.targetKey)).join(" + ")} ≥ ${requirement.value}`;
    case "count":
    {
      const groups = requirement.groups.map((group) => ENTITY_GROUP_LABELS[group]).join(" + ");
      const qualifiers = [
        requirement.tag ? `„${requirement.tag}"` : undefined,
        requirement.minGrade !== undefined ? `ranga ≥ ${requirement.minGrade}` : undefined,
      ].filter(Boolean).join(", ");

      return `${groups}${qualifiers ? ` (${qualifiers})` : ""} — co najmniej ${requirement.value}`;
    }
    default:
    {
      const unhandled: never = requirement;
      void unhandled;
      return "";
    }
  }
}
