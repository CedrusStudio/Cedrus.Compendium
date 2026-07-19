/**
 * Deterministic roll of a full `Offense` (leading + secondary weapon + damage
 * bonuses), reusing the SAME roll helpers as the interactive combat panel
 * (`handleWeaponDamageRolls` / `handleDamageOffenseRolls` in
 * characters/combat/Offense.ts) — the only difference is that randomness comes
 * from a seeded `RandomSource` instead of `Math.random`.
 *
 * This mirrors `calculateTotalDamage()` in
 * application/characters/combat/useCombatRolls.ts, but as a pure function.
 */

import {
  handleWeaponDamageRolls,
  handleDamageOffenseRolls,
  type Offense,
} from "@/domain/characters/combat/Offense";
import type { DamageSpec } from "@/domain/combat-lab/effects/Effect";
import type { RandomSource } from "@/domain/combat-lab/rng/Rng";

export type OffenseRollBreakdown =
{
  total: number;
  leading: number;
  secondary: number;
  damageBonus: number;
  additionalDamageBonus: number;
  /** True if any weapon die landed in its critical range. */
  critical: boolean;
};

/**
 * Roll every component of an `Offense` and sum them. Weapon dice go through
 * `handleWeaponDamageRolls` (which folds in critical damage); flat damage
 * bonuses through `handleDamageOffenseRolls`.
 */
export function rollOffense(offense: Offense, random: RandomSource): OffenseRollBreakdown
{
  const leadingResult = handleWeaponDamageRolls(offense.leadingWeapon, random);
  const secondaryResult = offense.secondaryWeapon
    ? handleWeaponDamageRolls(offense.secondaryWeapon, random)
    : { total: 0, rolls: [] as [number, boolean][] };
  const damageBonusResult = handleDamageOffenseRolls(offense.damageBonus, random);
  const additionalDamageBonusResult = handleDamageOffenseRolls(offense.additionalDamageBonus, random);

  const critical =
    leadingResult.rolls.some(([, isCrit]) => isCrit) ||
    secondaryResult.rolls.some(([, isCrit]) => isCrit);

  return {
    total: leadingResult.total + secondaryResult.total + damageBonusResult.total + additionalDamageBonusResult.total,
    leading: leadingResult.total,
    secondary: secondaryResult.total,
    damageBonus: damageBonusResult.total,
    additionalDamageBonus: additionalDamageBonusResult.total,
    critical,
  };
}

/** Roll a bare `DamageSpec` (used by damage effects). Reuses the flat-bonus path. */
export function rollDamageSpec(spec: DamageSpec, random: RandomSource): number
{
  const { total } = handleDamageOffenseRolls(
    { amount: spec.amount, grade: spec.grade, bonus: spec.bonus, isPhantom: spec.isPhantom ?? false },
    random,
  );
  return total;
}
