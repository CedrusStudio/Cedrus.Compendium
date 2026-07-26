/**
 * Requirement comparison engine (Wave 5, 5.2).
 *
 * Pure, display-only evaluation of whether a character SATISFIES a requirement.
 *
 * ## This layer must NEVER block anything
 *
 * It only *reports* satisfaction (colouring a chip, warning on a card). Adding
 * or editing an entity on a character stays possible even when the requirement
 * is unmet — the GM may well be making a deliberate narrative call, and the
 * application has no business overruling that. Confirmed by Marek, 2026-07-25;
 * treat it as a hard constraint, not a default. If hard gating is ever wanted it
 * is a separate, explicit decision — do not let it arrive by accident through a
 * `disabled` prop or a form-level validation rule.
 *
 * See src/domain/requirements/Requirement.ts for the model.
 */

import type { Character } from "@/domain/characters/Character";
import type { Statistic } from "@/domain/characters/statistics/Statistic";
import { getStatisticTotalTestValue } from "@/domain/characters/statistics/Statistic";
import {
  EQUIPMENT_TARGETS,
  type Requirement,
  type RankedRequirement,
  type RanklessRequirement,
  type AnyOfRequirement,
  type SumRequirement,
  type CountRequirement,
  type EntityRequirementGroup,
  isStatisticGroup,
  isPowerGroup,
  isDerivedGroup,
  isEquipmentGroup,
} from "@/domain/requirements/Requirement";
import { normalizeRequirementText } from "@/domain/requirements/normalizeRequirementText";

/**
 * Minimal shape shared by every rankable Kompendium entity a character owns.
 * `tags` is optional because Talents do not carry any.
 */
type NamedGraded = { name: string; grade: number; tags?: string[] };

/**
 * Returns `true` iff the character meets the requirement.
 *
 * - `ranked` + statistic group: character's total test value for the statistic
 *   is `>=` the required value (unknown key → `false`, never throws).
 * - `ranked` + entity group: character owns the named entity at a `grade` `>=`
 *   the required value (not owned → `false`).
 * - `rankless`: the normalized text matches the name of an owned entity
 *   (best-effort — free text is not semantically parsed by design).
 */
export function checkRequirement(requirement: Requirement, character: Character): boolean
{
  // Exhaustive on purpose (Wave 7.0): the `never` guard makes the compiler point
  // at this function the moment a new variant is added, instead of letting it
  // fall through an `else` branch and be silently treated as `ranked`.
  switch (requirement.kind)
  {
    case "rankless":
      return checkRanklessRequirement(requirement, character);
    case "ranked":
      return checkRankedRequirement(requirement, character);
    case "anyOf":
      return checkAnyOfRequirement(requirement, character);
    case "sum":
      return checkSumRequirement(requirement, character);
    case "count":
      return checkCountRequirement(requirement, character);
    default:
    {
      const unhandled: never = requirement;
      void unhandled;
      return false;
    }
  }
}

/** Convenience: every requirement in the list is met (empty list → `true`). */
export function areRequirementsMet(requirements: readonly Requirement[], character: Character): boolean
{
  return requirements.every((requirement) => checkRequirement(requirement, character));
}

/**
 * Satisfied as soon as one alternative is — "Moc 2 lub Więź 2".
 *
 * Options may be `ranked`, free text or a `sum`, so each is evaluated through
 * the top-level `checkRequirement`. A free-text option keeps free-text
 * semantics: satisfied only when the character owns something by that name.
 */
function checkAnyOfRequirement(requirement: AnyOfRequirement, character: Character): boolean
{
  return requirement.options.some((option) => checkRequirement(option, character));
}

/**
 * Sum of the targets' total test values vs. `value`.
 *
 * An unknown `targetKey` makes the whole requirement `false` rather than
 * contributing 0: a typo'd key would otherwise just quietly lower the sum and
 * report "not met" with no hint that the requirement itself is broken.
 */
function checkSumRequirement(requirement: SumRequirement, character: Character): boolean
{
  let total = 0;

  for (const target of requirement.targets)
  {
    const statistic = readStatistic(character, target.group, target.targetKey);
    if (!statistic)
    {
      return false;
    }

    total += getStatisticTotalTestValue(statistic);
  }

  return total >= requirement.value;
}

/**
 * "Own at least N of a kind" (Wave 8.1).
 *
 * Counts across every requested group, keeping only entities that carry `tag`
 * (when given) and reach `minGrade` (when given). Talents have no tags, so a
 * tag-filtered count simply never matches them — that is correct rather than a
 * gap: the library's tag vocabulary belongs to the compendium entities.
 */
function checkCountRequirement(requirement: CountRequirement, character: Character): boolean
{
  const owned = requirement.groups.flatMap((group) => ownedEntities(character, group));

  const matching = owned.filter((entity) =>
  {
    if (requirement.minGrade !== undefined && entity.grade < requirement.minGrade) return false;
    if (requirement.tag === undefined) return true;

    const tag = normalizeRequirementText(requirement.tag);
    return (entity.tags ?? []).some((entityTag) => normalizeRequirementText(entityTag) === tag);
  });

  return matching.length >= requirement.value;
}

function readStatistic(character: Character, group: "characteristics" | "attributes", targetKey: string): Statistic | undefined
{
  const container = group === "characteristics" ? character.characteristics : character.attributes;
  return (container as Record<string, Statistic | undefined>)[targetKey];
}

function checkRankedRequirement(requirement: RankedRequirement, character: Character): boolean
{
  if (isStatisticGroup(requirement.group))
  {
    const statistic = readStatistic(character, requirement.group, requirement.targetKey);

    if (!statistic)
    {
      return false;
    }

    return getStatisticTotalTestValue(statistic) >= requirement.value;
  }

  if (isPowerGroup(requirement.group))
  {
    return checkPowerRequirement(requirement, character);
  }

  if (isDerivedGroup(requirement.group))
  {
    return checkDerivedRequirement(requirement, character);
  }

  if (isEquipmentGroup(requirement.group))
  {
    return checkEquipmentRequirement(requirement, character);
  }

  const owned = ownedEntities(character, requirement.group);
  const target = normalizeRequirementText(requirement.targetKey);
  const bestGrade = owned
    .filter((entity) => normalizeRequirementText(entity.name) === target)
    .reduce<number | undefined>((best, entity) => (best === undefined ? entity.grade : Math.max(best, entity.grade)), undefined);

  if (bestGrade === undefined)
  {
    return false;
  }

  return bestGrade >= requirement.value;
}

function checkRanklessRequirement(requirement: RanklessRequirement, character: Character): boolean
{
  const target = normalizeRequirementText(requirement.text);

  if (target.length === 0)
  {
    return false;
  }

  return allOwnedEntities(character).some((entity) => normalizeRequirementText(entity.name) === target);
}

/**
 * Highest `level` among the character's Powers of the requested type (Wave 7.2).
 *
 * Compares `level` ALONE — `bonus` is deliberately excluded, even though
 * `PowerCard` renders the effective power as `level + bonus` and statistics are
 * compared with their bonuses included. A requirement describes how far the
 * character has actually developed the Power, not what a temporary modifier
 * pushes it to. Do not "fix" this into `level + bonus`.
 */
function checkPowerRequirement(requirement: RankedRequirement, character: Character): boolean
{
  const levels = character.powers
    .filter((power) => power.type === requirement.targetKey)
    .map((power) => power.level);

  if (levels.length === 0)
  {
    return false;
  }

  return Math.max(...levels) >= requirement.value;
}

/**
 * Values computed from the character (Wave 7.6).
 *
 * All of them take the HIGHEST value the character can reach, mirroring how an
 * entity requirement takes the best owned copy: the character qualifies through
 * whichever Power or defence profile is strongest. An unknown key yields
 * `undefined`, which the caller turns into "not met" rather than an exception.
 */
function derivedValue(character: Character, key: string): number | undefined
{
  if (key === "spellStrength")
  {
    // „Siła zaklęcia" is `level + bonus`, the formula `CharacterPowersBattleView`
    // and `PowerCard` display. Deliberately unlike a `powers` requirement, which
    // compares bare `level`: "SZ 6" asks what the character actually casts at,
    // "Moc 2" asks how far the Power itself has been developed.
    return highest(character.powers.map((power) => power.level + power.bonus));
  }

  if (key === "dodge" || key === "parry")
  {
    // A character may keep several defence profiles (`defenses[]`); the best one
    // counts, the same way any offence satisfies a critical requirement.
    return highest(character.defenses.map((defense) => (key === "dodge" ? defense.dodge : defense.parry)));
  }

  // Health values are single, not per-profile, so they are read straight off.
  if (key === "recoveryLevel") return character.health.recoveryLevel;
  if (key === "toughness") return character.health.toughness;

  if (key === "dualWield")
  {
    // A fighting style rather than a value: 1 when any offence carries a second
    // weapon. Marek: "dwa miecze" and "broń w obu rękach" both mean this.
    return character.offenses.some((offense) => offense.secondaryWeapon !== undefined) ? 1 : 0;
  }

  return undefined;
}

function highest(values: readonly number[]): number | undefined
{
  return values.length > 0 ? Math.max(...values) : undefined;
}

function checkDerivedRequirement(requirement: RankedRequirement, character: Character): boolean
{
  const value = derivedValue(character, requirement.targetKey);
  return value !== undefined && value >= requirement.value;
}

/**
 * Equipment by category (Wave 8.2).
 *
 * Two shapes, both driven by `EQUIPMENT_TARGETS`:
 *  - a TIERED category ("zbroja", "tarcza") compares the best owned item's tier
 *    against `value`, so "co najmniej średnia tarcza" is `value: 3`;
 *  - a plain category ("miecz", "łuk") is satisfied by owning any such item.
 *
 * Shield tiers come from `block`, not from tags — see `EquipmentTarget`.
 */
function checkEquipmentRequirement(requirement: RankedRequirement, character: Character): boolean
{
  const target = EQUIPMENT_TARGETS.find((entry) => entry.key === requirement.targetKey);
  if (!target)
  {
    return false;
  }

  if (target.slot === "shields")
  {
    const tiers = target.blockTiers ?? [];
    const best = character.equipment.shields
      .reduce((highest, shield) => Math.max(highest, shieldTier(shield.block, tiers)), 0);
    return best >= requirement.value;
  }

  if (target.slot === "armors")
  {
    const best = character.equipment.armors
      .reduce((highest, armor) => Math.max(highest, tagTier(armor.tags, target.tiers ?? [])), 0);
    return best >= requirement.value;
  }

  // Some weapon categories are identified by `style` (Dwuręczny) rather than a tag.
  if (target.style)
  {
    return character.equipment.weapons.some((weapon) => weapon.style === target.style);
  }

  const tag = normalizeRequirementText(target.tag ?? "");
  return character.equipment.weapons.some((weapon) => weapon.tags.some((itemTag) => normalizeRequirementText(itemTag) === tag));
}

/** 1-based tier of a shield, from the ordered `block` upper bounds. */
function shieldTier(block: number, tiers: readonly number[]): number
{
  const index = tiers.findIndex((upperBound) => block <= upperBound);
  return index === -1 ? tiers.length + 1 : index + 1;
}

/** 1-based tier of a tagged item, from the ordered tier tags. */
function tagTier(tags: readonly string[], tiers: readonly string[]): number
{
  const normalized = tags.map((tag) => normalizeRequirementText(tag));
  let best = 0;

  tiers.forEach((tier, index) =>
  {
    if (normalized.includes(normalizeRequirementText(tier)))
    {
      best = Math.max(best, index + 1);
    }
  });

  return best;
}

function ownedEntities(character: Character, group: EntityRequirementGroup): readonly NamedGraded[]
{
  switch (group)
  {
    case "maneuvers":
      return character.maneuvers;
    case "stances":
      return character.stances;
    case "states":
      return character.states;
    case "perks":
      return character.perks;
    case "talents":
      // Talents ("umiejętności") live embedded on the character and already
      // carry `{ name, grade }`, so they slot into the same comparison.
      return character.talents;
    case "spells":
      return character.powers.flatMap((power) => power.spells);
  }
}

function allOwnedEntities(character: Character): readonly NamedGraded[]
{
  return [
    ...character.maneuvers,
    ...character.stances,
    ...character.states,
    ...character.perks,
    ...character.talents,
    ...character.powers.flatMap((power) => power.spells),
  ];
}
