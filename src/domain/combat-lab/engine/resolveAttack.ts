/**
 * Resolve a basic MELEE weapon attack: roll the attacker's offense, reduce by
 * the defender's defense. Pure — returns numbers only; the caller applies them
 * to runtime state and logs. Randomness is injected (deterministic).
 *
 * Rulebook: melee has NO to-hit roll — you roll damage dice (after the
 * defender's Niewrażliwość removes dice) and subtract reduction. Dodge/parry are
 * damage reduction, not a miss chance. Melee deals "zwyczajne" damage → full
 * reduction. (Ranged attacks DO have a precyzja to-hit test and deal
 * "bezpośrednie" damage — see plan; not yet modelled.)
 */

import type { CombatantSnapshot } from "@/domain/combat-lab/engine/CombatantSnapshot";
import { selectDefaultOffense, selectDefaultDefense } from "@/domain/combat-lab/engine/CombatantSnapshot";
import { rollOffense, applyImmunity } from "@/domain/combat-lab/engine/rollOffense";
import { reduceDamage, halveGuards } from "@/domain/combat-lab/engine/damage";
import { effectiveOffense, effectiveDefense } from "@/domain/combat-lab/engine/buffs";
import type { BuffProfile } from "@/domain/characters/buffs/BuffProfile";
import type { RandomSource } from "@/domain/combat-lab/rng/Rng";

export type AttackResolution =
{
  raw: number;
  reduced: number;
  dealt: number;
  critical: boolean;
};

export type AttackModifiers =
{
  /** Attacker is staggered → one fewer weapon die. */
  attackerStaggered?: boolean;
  /** Defender is staggered → half block/parry/dodge. */
  defenderStaggered?: boolean;
  /** Active buff/debuff profiles on the attacker (raise the offense). */
  attackerBuffs?: BuffProfile[];
  /** Active buff/debuff profiles on the defender (raise/lower the defense). */
  defenderBuffs?: BuffProfile[];
};

/**
 * Roll `attacker`'s default offense against `defender`'s default defense (melee,
 * "zwyczajne" damage). Stagger modifiers adjust dice / guards per rulebook.
 */
export function resolveAttack(
  attacker: CombatantSnapshot,
  defender: CombatantSnapshot,
  random: RandomSource,
  modifiers: AttackModifiers = {},
): AttackResolution
{
  const baseOffense = selectDefaultOffense(attacker);

  if (!baseOffense)
  {
    return { raw: 0, reduced: 0, dealt: 0, critical: false };
  }

  // Active buffs raise the attacker's offense (e.g. a self-buff maneuver used
  // earlier this turn) and adjust the defender's defense.
  const offense = effectiveOffense(baseOffense, modifiers.attackerBuffs ?? []);
  const rawDefense = selectDefaultDefense(defender);
  const buffedDefense = rawDefense ? effectiveDefense(rawDefense, modifiers.defenderBuffs ?? []) : undefined;
  const defense = buffedDefense && modifiers.defenderStaggered ? halveGuards(buffedDefense) : buffedDefense;

  // Niewrażliwość removes attacker dice before the roll; stagger removes one more.
  const diceToRemove = (buffedDefense?.immunity ?? 0) + (modifiers.attackerStaggered ? 1 : 0);
  const rolledOffense = diceToRemove > 0 ? applyImmunity(offense, diceToRemove) : offense;
  const rolled = rollOffense(rolledOffense, random);
  const dealt = reduceDamage(rolled.total, defense, "zwyczajne");

  return {
    raw: rolled.total,
    reduced: rolled.total - dealt,
    dealt,
    critical: rolled.critical,
  };
}
