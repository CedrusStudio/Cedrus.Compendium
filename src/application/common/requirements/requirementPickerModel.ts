/**
 * Pure model behind `RequirementPicker` (Wave 5, 5.3; extended in Wave 7). Kept
 * free of React so the mode-switch / data-preservation rules can be unit-tested
 * in isolation.
 */

import { SKILLS } from "@/domain/characters/statistics/skills";
import {
  DERIVED_TARGETS,
  ENTITY_GROUP_LABELS,
  ENTITY_REQUIREMENT_GROUPS,
  EQUIPMENT_TARGETS,
  type AnyOfOption,
  type EntityRequirementGroup,
  type RankedRequirement,
  type Requirement,
  type RequirementTargetGroup,
  type StatisticTarget,
  isDerivedGroup,
  isEquipmentGroup,
  isPowerGroup,
  isStatisticGroup,
} from "@/domain/requirements/Requirement";

export { ENTITY_GROUP_LABELS, ENTITY_REQUIREMENT_GROUPS };

/** The value shown in the picker's "type" select: a target group, free text, or a composite. */
export type RequirementPickerType = "text" | "anyOf" | "sum" | "count" | RequirementTargetGroup;

export const REQUIREMENT_TYPE_ORDER: readonly RequirementPickerType[] = [
  "text",
  "characteristics",
  "attributes",
  "talents",
  "maneuvers",
  "stances",
  "states",
  "spells",
  "perks",
  "powers",
  "derived",
  "equipment",
  "anyOf",
  "sum",
  "count",
];

export const REQUIREMENT_TYPE_LABELS: Record<RequirementPickerType, string> = {
  text: "Dowolny tekst",
  characteristics: "Cecha",
  attributes: "Atrybut",
  talents: "Umiejętność",
  maneuvers: "Manewr",
  stances: "Postawa",
  states: "Stan",
  spells: "Zaklęcie",
  perks: "Atut",
  powers: "Moc / Więź",
  derived: "Wartość pochodna",
  equipment: "Sprzęt",
  anyOf: "Alternatywa (lub)",
  sum: "Suma cech",
  count: "Ilość (licznik)",
};

/** The two Power types a `powers` requirement can target. */
export const POWER_TYPE_ITEMS: readonly { key: string; label: string }[] = [
  { key: "moc", label: "Moc" },
  { key: "wiez", label: "Więź" },
];

/** Cached data for each mode, so toggling type never loses the other mode's input. */
export type RequirementDraftCache = {
  ranklessText: string;
  ranked: { group: RequirementTargetGroup; targetKey: string; value: number };
  anyOfOptions: AnyOfOption[];
  sum: { targets: StatisticTarget[]; value: number };
  count: { groups: EntityRequirementGroup[]; tag?: string; minGrade?: number; value: number };
};

export function skillKeysForGroup(group: RequirementTargetGroup): string[]
{
  return SKILLS.filter(([g]) => g === group).map(([, key]) => key);
}

export function skillLabel(key: string): string
{
  return SKILLS.find(([, k]) => k === key)?.[2] ?? key;
}

export function firstSkillKey(group: RequirementTargetGroup): string
{
  return skillKeysForGroup(group)[0] ?? "";
}

/** A sensible starting target for a freshly-selected group. */
export function defaultTargetKeyForGroup(group: RequirementTargetGroup): string
{
  if (isStatisticGroup(group)) return firstSkillKey(group);
  if (isPowerGroup(group)) return "moc";
  if (isDerivedGroup(group)) return DERIVED_TARGETS[0]?.key ?? "";
  if (isEquipmentGroup(group)) return EQUIPMENT_TARGETS[0]?.key ?? "";
  return "";
}

export function typeOfRequirement(requirement: Requirement): RequirementPickerType
{
  switch (requirement.kind)
  {
    case "rankless":
      return "text";
    case "ranked":
      return requirement.group;
    case "anyOf":
      return "anyOf";
    case "sum":
      return "sum";
    case "count":
      return "count";
  }
}

function defaultAnyOfOptions(): RankedRequirement[]
{
  // Seeded with the case that motivated the variant: magic comes either from
  // bloodline (Moc) or from a bond with a deity (Więź) — either satisfies.
  return [
    { kind: "ranked", group: "powers", targetKey: "moc", value: 1 },
    { kind: "ranked", group: "powers", targetKey: "wiez", value: 1 },
  ];
}

function defaultSumTargets(): StatisticTarget[]
{
  return [
    { group: "characteristics", targetKey: "mind" },
    { group: "characteristics", targetKey: "dexterity" },
  ];
}

export function defaultDraftCache(): RequirementDraftCache
{
  return {
    ranklessText: "",
    ranked: { group: "characteristics", targetKey: firstSkillKey("characteristics"), value: 0 },
    anyOfOptions: defaultAnyOfOptions(),
    sum: { targets: defaultSumTargets(), value: 0 },
    count: { groups: ["maneuvers"], value: 1 },
  };
}

/** Fold the current requirement into the cache so the other modes are remembered. */
export function updateCache(cache: RequirementDraftCache, requirement: Requirement): RequirementDraftCache
{
  switch (requirement.kind)
  {
    case "rankless":
      return { ...cache, ranklessText: requirement.text };
    case "ranked":
      return { ...cache, ranked: { group: requirement.group, targetKey: requirement.targetKey, value: requirement.value } };
    case "anyOf":
      return { ...cache, anyOfOptions: requirement.options };
    case "sum":
      return { ...cache, sum: { targets: requirement.targets, value: requirement.value } };
    case "count":
      return { ...cache, count: { groups: requirement.groups, tag: requirement.tag, minGrade: requirement.minGrade, value: requirement.value } };
  }
}

/**
 * Build the requirement for a newly-selected type, restoring cached input:
 *  - `text` restores the last free-text.
 *  - a statistic group keeps the cached stat key only if it belongs to that
 *    group, otherwise falls back to the group's first skill.
 *  - an entity group keeps the cached free-text name across entity groups.
 *  - `powers` falls back to "moc", because a stat key or an entity name is
 *    meaningless as a Power type.
 *  - `anyOf` / `sum` restore their cached lists, seeded on first use.
 */
export function buildRequirementForType(type: RequirementPickerType, cache: RequirementDraftCache): Requirement
{
  if (type === "text")
  {
    return { kind: "rankless", text: cache.ranklessText };
  }

  if (type === "anyOf")
  {
    return { kind: "anyOf", options: cache.anyOfOptions.length >= 2 ? cache.anyOfOptions : defaultAnyOfOptions() };
  }

  if (type === "sum")
  {
    const targets = cache.sum.targets.length >= 2 ? cache.sum.targets : defaultSumTargets();
    return { kind: "sum", targets, value: cache.sum.value };
  }

  if (type === "count")
  {
    const groups = cache.count.groups.length > 0 ? cache.count.groups : ["maneuvers" as EntityRequirementGroup];
    return {
      kind: "count",
      groups,
      ...(cache.count.tag ? { tag: cache.count.tag } : {}),
      ...(cache.count.minGrade === undefined ? {} : { minGrade: cache.count.minGrade }),
      value: cache.count.value,
    };
  }

  const previous = cache.ranked;
  const value = previous.value;

  if (isStatisticGroup(type))
  {
    const keys = skillKeysForGroup(type);
    const targetKey = previous.group === type && keys.includes(previous.targetKey) ? previous.targetKey : (keys[0] ?? "");
    return { kind: "ranked", group: type, targetKey, value };
  }

  if (isPowerGroup(type))
  {
    const targetKey = POWER_TYPE_ITEMS.some((item) => item.key === previous.targetKey) ? previous.targetKey : "moc";
    return { kind: "ranked", group: type, targetKey, value };
  }

  if (isDerivedGroup(type) || isEquipmentGroup(type))
  {
    const known = (isDerivedGroup(type) ? DERIVED_TARGETS : EQUIPMENT_TARGETS).some((target) => target.key === previous.targetKey);
    return { kind: "ranked", group: type, targetKey: known ? previous.targetKey : defaultTargetKeyForGroup(type), value };
  }

  // Entity groups share the free-text name, but a stat key, Power type, derived
  // or equipment key must not leak in as an entity name.
  const reusable = !isStatisticGroup(previous.group)
    && !isPowerGroup(previous.group)
    && !isDerivedGroup(previous.group)
    && !isEquipmentGroup(previous.group);
  return { kind: "ranked", group: type, targetKey: reusable ? previous.targetKey : "", value };
}
