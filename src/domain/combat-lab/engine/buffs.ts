/**
 * Apply active buff/debuff profiles to an offense/defense at resolve time. This
 * is how a maneuver self-buff raises the following attack (chosen model (a)):
 * the buff isn't baked into the snapshot — it's layered on when the attack is
 * actually rolled. Reuses the app's own buff appliers so combat-lab and the
 * character sheet stay consistent.
 */

import type { Offense } from "@/domain/characters/combat/Offense";
import type { Defense } from "@/domain/characters/combat/Defense";
import type { Statistic } from "@/domain/characters/statistics/Statistic";
import type { BuffProfile } from "@/domain/characters/buffs/BuffProfile";
import type { Attributes } from "@/domain/characters/statistics/Attributes";
import type { Characteristics } from "@/domain/characters/statistics/Characteristics";
import type { CombatantSnapshot } from "@/domain/combat-lab/engine/CombatantSnapshot";
import { applyOffenseBuff, applyDefenseBuff, applyStatisticBuff } from "@/domain/characters/buffs/applyBuffProfile";

/** Offense with every active buff/debuff profile's offense part applied. */
export function effectiveOffense(offense: Offense, profiles: BuffProfile[]): Offense
{
  if (profiles.length === 0) return offense;
  return profiles.reduce((current, profile) => applyOffenseBuff(current, profile), offense);
}

/** Defense with every active buff/debuff profile's defense part applied. */
export function effectiveDefense(defense: Defense, profiles: BuffProfile[]): Defense
{
  if (profiles.length === 0) return defense;
  return profiles.reduce((current, profile) => applyDefenseBuff(current, profile.defense), defense);
}

/** Precyzja with active profiles' precision buffs applied (ranged to-hit). */
export function effectivePrecision(precision: Statistic, profiles: BuffProfile[]): Statistic
{
  if (profiles.length === 0) return precision;
  return profiles.reduce((current, profile) => applyStatisticBuff(current, profile.attributes.precision), precision);
}

/** Refleks with active profiles' reflex buffs applied (ranged to-hit ST). */
export function effectiveReflex(reflex: Statistic, profiles: BuffProfile[]): Statistic
{
  if (profiles.length === 0) return reflex;
  return profiles.reduce((current, profile) => applyStatisticBuff(current, profile.attributes.reflex), reflex);
}

/**
 * Skills with every active profile's attribute/characteristic buff applied
 * (Wave 9.2).
 *
 * `toCombatantSnapshot` freezes `skills` when the snapshot is built, and
 * `resolveContestedTest` used to read that frozen copy — so a "+2 fencing"
 * granted mid-fight never reached the one mechanic where fencing is rolled.
 * Contested tests now go through here, the same way attacks already go through
 * `effectiveOffense`.
 *
 * The snapshot itself is NEVER touched: it is shared across simulation runs, so
 * mutating it would poison every later fight with the same object.
 */
export function effectiveSkills(
  skills: CombatantSnapshot["skills"],
  profiles: BuffProfile[],
): CombatantSnapshot["skills"]
{
  // Hot path: contested tests run inside the simulation loop (hundreds of
  // fights × several rolls), and most combatants carry no profiles at all.
  if (profiles.length === 0) return skills;

  const attributes = { ...skills.attributes };
  for (const key of Object.keys(attributes) as (keyof Attributes)[])
  {
    attributes[key] = profiles.reduce(
      (current, profile) => (profile.attributes?.[key] ? applyStatisticBuff(current, profile.attributes[key]) : current),
      skills.attributes[key],
    );
  }

  const characteristics = { ...skills.characteristics };
  for (const key of Object.keys(characteristics) as (keyof Characteristics)[])
  {
    characteristics[key] = profiles.reduce(
      (current, profile) => (profile.characteristics?.[key] ? applyStatisticBuff(current, profile.characteristics[key]) : current),
      skills.characteristics[key],
    );
  }

  return { attributes, characteristics };
}
