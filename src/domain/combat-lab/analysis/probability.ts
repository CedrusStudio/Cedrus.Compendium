/**
 * Probability Explorer: a fast, deterministic Monte-Carlo of a SINGLE attack
 * exchange. Change one input and instantly see the effect on expected damage,
 * crit rate, ranged hit chance, damage distribution and hits-to-kill. Reuses the
 * real engine helpers (immunity dice removal, category reduction, crits), so the
 * numbers match full simulations.
 *
 * Pure domain, seeded (same config → same result).
 */

import type { Offense } from "@/domain/characters/combat/Offense";
import { roll } from "@/domain/characters/combat/Offense";
import type { Defense } from "@/domain/characters/combat/Defense";
import type { Statistic } from "@/domain/characters/statistics/Statistic";
import { getStatisticTotalTestValue } from "@/domain/characters/statistics/Statistic";
import type { DamageType } from "@/domain/combat-lab/effects/Effect";
import { rollOffense, applyImmunity } from "@/domain/combat-lab/engine/rollOffense";
import { reduceDamage } from "@/domain/combat-lab/engine/damage";
import { createRng } from "@/domain/combat-lab/rng/Rng";

export type RangedConfig =
{
  precision: Statistic;
  reflex: Statistic;
  distanceST: number;
};

export type ProbabilityConfig =
{
  offense: Offense;
  defense: Defense;
  category: DamageType;
  targetHp: number;
  /** If set, applies a ranged to-hit test before damage. */
  ranged?: RangedConfig;
  /** Monte-Carlo sample count. Default 5000. */
  samples?: number;
  /** Histogram bin count for the damage distribution. Default 12. */
  bins?: number;
};

export type ProbabilityResult =
{
  samples: number;
  /** Mean rolled damage before defense (as if it hit). */
  expectedRaw: number;
  /** Mean damage actually dealt (after reduction, and misses for ranged). */
  expectedDealt: number;
  /** Fraction of attacks with at least one critical die. */
  critRate: number;
  /** Ranged only — fraction of attacks that hit. `null` for melee. */
  hitChance: number | null;
  /** Hits needed to down a `targetHp` combatant. `null` if no damage gets through. */
  ttk: number | null;
  /** Dealt-damage histogram. */
  distribution: { label: string; count: number }[];
};

export function explore(config: ProbabilityConfig): ProbabilityResult
{
  const samples = config.samples ?? 5000;
  const rng = createRng(1);
  const random = rng.next;

  let rawSum = 0;
  let dealtSum = 0;
  let critCount = 0;
  let hitCount = 0;
  const dealtValues: number[] = new Array(samples);

  const effectiveOffense = applyImmunity(config.offense, config.defense.immunity);
  const st = config.ranged ? Math.max(getStatisticTotalTestValue(config.ranged.reflex), config.ranged.distanceST) : 0;

  for (let i = 0; i < samples; i++)
  {
    let hit = true;
    if (config.ranged)
    {
      const attackRoll = roll(config.ranged.precision.grade, random) + getStatisticTotalTestValue(config.ranged.precision);
      hit = attackRoll > st;
      if (hit) hitCount += 1;
    }

    const rolled = rollOffense(effectiveOffense, random);
    rawSum += rolled.total;
    if (rolled.critical) critCount += 1;

    const dealt = hit ? reduceDamage(rolled.total, config.defense, config.category) : 0;
    dealtSum += dealt;
    dealtValues[i] = dealt;
  }

  const expectedDealt = dealtSum / samples;

  return {
    samples,
    expectedRaw: rawSum / samples,
    expectedDealt,
    critRate: critCount / samples,
    hitChance: config.ranged ? hitCount / samples : null,
    ttk: expectedDealt > 0 ? Math.ceil(config.targetHp / expectedDealt) : null,
    distribution: histogram(dealtValues, config.bins ?? 12),
  };
}

function histogram(values: number[], bins: number): { label: string; count: number }[]
{
  if (values.length === 0) return [];
  const min = Math.min(...values);
  const max = Math.max(...values);
  if (min === max) return [{ label: String(min), count: values.length }];

  const width = (max - min) / bins;
  const buckets = Array.from({ length: bins }, (_, i) => ({
    label: `${Math.round(min + i * width)}`,
    count: 0,
  }));

  for (const value of values)
  {
    const index = Math.min(bins - 1, Math.floor((value - min) / width));
    buckets[index]!.count += 1;
  }
  return buckets;
}
