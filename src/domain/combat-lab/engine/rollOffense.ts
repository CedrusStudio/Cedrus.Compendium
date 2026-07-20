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

/**
 * Apply Niewrażliwość (immunity): remove `immunity` non-phantom dice from an
 * offense before rolling. Rulebook: "o ile mniej kości, z wyłączeniem kości
 * widmowych, będzie stosował przeciwnik... Przeciwnik sam wybiera, która kość
 * jest redukowana." A rational attacker drops the lowest-value dice first, so
 * we remove from the smallest-`grade` non-phantom components first. Flat bonuses
 * are untouched (they are not dice). Returns a shallow copy; the input is not
 * mutated.
 */
export function applyImmunity(offense: Offense, immunity: number): Offense
{
  let toRemove = Math.max(0, Math.floor(immunity));
  if (toRemove === 0) return offense;

  const next: Offense = {
    ...offense,
    leadingWeapon: { ...offense.leadingWeapon },
    secondaryWeapon: offense.secondaryWeapon ? { ...offense.secondaryWeapon } : undefined,
    damageBonus: { ...offense.damageBonus },
    additionalDamageBonus: offense.additionalDamageBonus ? { ...offense.additionalDamageBonus } : undefined,
  };

  // Removable components (non-phantom, with dice), smallest grade first.
  const components = [next.leadingWeapon, next.secondaryWeapon, next.damageBonus, next.additionalDamageBonus]
    .filter((c): c is NonNullable<typeof c> => !!c && !c.isPhantom && c.amount > 0)
    .sort((a, b) => a.grade - b.grade);

  for (const component of components)
  {
    if (toRemove === 0) break;
    const removed = Math.min(component.amount, toRemove);
    component.amount -= removed;
    toRemove -= removed;
  }

  return next;
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
