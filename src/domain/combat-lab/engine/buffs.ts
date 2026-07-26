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
