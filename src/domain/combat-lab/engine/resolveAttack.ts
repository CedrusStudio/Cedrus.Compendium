/**
 * Resolve a basic weapon attack: roll the attacker's offense, reduce by the
 * defender's defense. Pure — returns numbers only; the caller applies them to
 * runtime state and logs. Randomness is injected (deterministic).
 */

import type { CombatantSnapshot } from "@/domain/combat-lab/engine/CombatantSnapshot";
import { selectDefaultOffense, selectDefaultDefense } from "@/domain/combat-lab/engine/CombatantSnapshot";
import { rollOffense } from "@/domain/combat-lab/engine/rollOffense";
import { reduceDamage, defaultDamageResolution, type DamageResolutionConfig } from "@/domain/combat-lab/engine/damage";
import type { RandomSource } from "@/domain/combat-lab/rng/Rng";

export type AttackResolution =
{
  raw: number;
  reduced: number;
  dealt: number;
  critical: boolean;
};

/**
 * Roll `attacker`'s default offense against `defender`'s default defense.
 */
export function resolveAttack(
  attacker: CombatantSnapshot,
  defender: CombatantSnapshot,
  random: RandomSource,
  config: DamageResolutionConfig = defaultDamageResolution,
): AttackResolution
{
  const offense = selectDefaultOffense(attacker);

  if (!offense)
  {
    return { raw: 0, reduced: 0, dealt: 0, critical: false };
  }

  const rolled = rollOffense(offense, random);
  const defense = selectDefaultDefense(defender);
  const dealt = reduceDamage(rolled.total, defense, config);

  return {
    raw: rolled.total,
    reduced: rolled.total - dealt,
    dealt,
    critical: rolled.critical,
  };
}
