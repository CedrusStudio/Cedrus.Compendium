/**
 * Resolve a RANGED attack (łuk/kusza or magia dystansowa). Unlike melee, ranged
 * has a to-hit test (rulebook, "Ataki dystansowe"):
 *
 *   test precyzji atakującego  vs  max(refleks obrońcy, ST odległości)
 *   trafienie, gdy wynik testu jest o co najmniej 1 większy od ST.
 *
 * On a hit the target takes:
 *   - "bezpośrednie" for physical ranged (skips dodge/parry/block),
 *   - "blokowane" for magic ranged (skips dodge/parry, block still applies).
 *
 * Distance ST comes from the rulebook table (Blisko 3 / Normalny 5 / Daleki 8 /
 * Skraj 12); it is passed in (Scenario Builder will own real positioning).
 * Pure + deterministic (injected rng).
 */

import type { CombatantSnapshot } from "@/domain/combat-lab/engine/CombatantSnapshot";
import { selectDefaultOffense, selectDefaultDefense } from "@/domain/combat-lab/engine/CombatantSnapshot";
import type { Offense } from "@/domain/characters/combat/Offense";
import type { DamageType, RollModifierEffect } from "@/domain/combat-lab/effects/Effect";
import { applyImmunity, rollOffenseWithModifiers, stripCritical } from "@/domain/combat-lab/engine/rollOffense";
import { reduceDamage } from "@/domain/combat-lab/engine/damage";
import { effectiveOffense, effectiveDefense, effectivePrecision, effectiveReflex } from "@/domain/combat-lab/engine/buffs";
import type { BuffProfile } from "@/domain/characters/buffs/BuffProfile";
import { roll } from "@/domain/characters/combat/Offense";
import { getStatisticTotalTestValue } from "@/domain/characters/statistics/Statistic";
import type { RandomSource } from "@/domain/combat-lab/rng/Rng";

export type RangedAttackResolution =
{
  hit: boolean;
  attackRoll: number;
  st: number;
  raw: number;
  reduced: number;
  dealt: number;
  critical: boolean;
};

export type RangedAttackOptions =
{
  /** ST of the shooting distance (rulebook: Blisko 3 / Normalny 5 / …). */
  distanceST: number;
  /** Damage category on hit. */
  category: DamageType;
  /** Attacker staggered → one fewer weapon die. */
  attackerStaggered?: boolean;
  /** Active buff/debuff profiles on the attacker / defender. */
  attackerBuffs?: BuffProfile[];
  defenderBuffs?: BuffProfile[];
  /** Roll modifiers (T2b) applied to the DAMAGE roll on a hit. */
  rollMods?: RollModifierEffect[];
  /** Override the attacker's offense (e.g. a spell's resolved offense) instead of the default weapon. */
  offenseOverride?: Offense;
  /** Attacker's crits are suppressed this attack ("nie można zadać krytyka"). */
  suppressCrit?: boolean;
};

const MISS: RangedAttackResolution = { hit: false, attackRoll: 0, st: 0, raw: 0, reduced: 0, dealt: 0, critical: false };

export function resolveRangedAttack(
  attacker: CombatantSnapshot,
  defender: CombatantSnapshot,
  random: RandomSource,
  options: RangedAttackOptions,
): RangedAttackResolution
{
  const baseOffense = options.offenseOverride ?? selectDefaultOffense(attacker);
  if (!baseOffense) return { ...MISS };

  // To-hit: precyzja test vs max(refleks obrońcy, ST odległości). Active buffs
  // raise the attacker's precyzja and the defender's refleks.
  const precision = effectivePrecision(attacker.precision, options.attackerBuffs ?? []);
  const reflex = effectiveReflex(defender.reflex, options.defenderBuffs ?? []);
  const attackRoll = roll(precision.grade, random) + getStatisticTotalTestValue(precision);
  const reflexST = getStatisticTotalTestValue(reflex);
  const st = Math.max(reflexST, options.distanceST);

  if (attackRoll <= st)
  {
    return { ...MISS, attackRoll, st };
  }

  const buffedOffense = effectiveOffense(baseOffense, options.attackerBuffs ?? []);
  const offense = options.suppressCrit ? stripCritical(buffedOffense) : buffedOffense;
  const rawDefense = selectDefaultDefense(defender);
  const defense = rawDefense ? effectiveDefense(rawDefense, options.defenderBuffs ?? []) : undefined;
  const diceToRemove = (defense?.immunity ?? 0) + (options.attackerStaggered ? 1 : 0);
  const rolledOffense = diceToRemove > 0 ? applyImmunity(offense, diceToRemove) : offense;
  const rolled = rollOffenseWithModifiers(rolledOffense, random, options.rollMods ?? []);
  const dealt = reduceDamage(rolled.total, defense, options.category);

  return {
    hit: true,
    attackRoll,
    st,
    raw: rolled.total,
    reduced: rolled.total - dealt,
    dealt,
    critical: rolled.critical,
  };
}

/** Damage category implied by a ranged attack kind. */
export function rangedCategory(kind: "rangedPhysical" | "rangedMagic"): DamageType
{
  return kind === "rangedPhysical" ? "bezpośrednie" : "blokowane";
}

/** Standard rulebook distance STs, for callers/UI. */
export const DISTANCE_ST = {
  blisko: 3,
  normalny: 5,
  daleki: 8,
  skraj: 12,
} as const;
