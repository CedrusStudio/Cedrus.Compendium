/**
 * Shared expected-value helpers for policies. Kept in their own module so both
 * the damage-only greedy policy and the richer value policy can use them without
 * an import cycle.
 */

import type { Effect, DamageSpec } from "@/domain/combat-lab/effects/Effect";
import type { Offense } from "@/domain/characters/combat/Offense";

/** Average result of a `k(grade*2)` die: (2*grade + 1) / 2. */
export function expectedDie(grade: number): number
{
  return grade <= 0 ? 0 : (2 * grade + 1) / 2;
}

export function expectedDamageSpec(spec: DamageSpec): number
{
  return spec.amount * expectedDie(spec.grade) + spec.bonus;
}

export function expectedOffenseDamage(offense: Offense): number
{
  const weapon = (o: DamageSpec & { critical?: { power: number; range: number } }): number =>
  {
    const base = o.amount * expectedDie(o.grade) + o.bonus;
    // Rough expected critical contribution: power * (range coverage / faces).
    const faces = Math.max(1, o.grade * 2);
    const critChance = o.critical ? Math.min(1, Math.max(0, (o.critical.range + 1) / faces)) : 0;
    const critBonus = o.critical ? o.critical.power * critChance * o.amount : 0;
    return base + critBonus;
  };

  let total = weapon(offense.leadingWeapon);
  if (offense.secondaryWeapon) total += weapon(offense.secondaryWeapon);
  total += expectedDamageSpec(offense.damageBonus);
  if (offense.additionalDamageBonus) total += expectedDamageSpec(offense.additionalDamageBonus);
  return total;
}

/** Expected DIRECT damage a maneuver's effects produce (chance-weighted). */
export function expectedEffectDamage(effects: Effect[]): number
{
  let total = 0;
  for (const effect of effects)
  {
    if (effect.type === "damage") total += expectedDamageSpec(effect.damage);
    else if (effect.type === "status" && effect.tick) total += expectedDamageSpec(effect.tick.damage) * Math.max(1, effect.duration);
    else if (effect.type === "chance") total += (effect.chance / 100) * expectedEffectDamage(effect.then);
  }
  return total;
}
