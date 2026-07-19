/**
 * Damage application against a combatant's barrier + hp pools, plus the
 * defensive reduction model.
 *
 * ⚠️ RULE ASSUMPTIONS (to confirm against the Cedrus rulebook — see plan,
 * Otwarte pytania). The existing code only exposes `calculateSelectedReduction`
 * (a flat reduction from block/parry/dodge/protection/bonus) and leaves
 * `immunity` / `resistance` unmodelled. Until the rulebook pins these down, the
 * engine uses this documented baseline, isolated here so it is trivial to
 * correct in one place:
 *   - `reduction` (flat)   → subtracted from raw damage (existing function).
 *   - `resistance` (flat)  → further flat subtraction.
 *   - `immunity` (percent) → final multiplier: dealt = afterFlat * (1 - immunity/100),
 *                            clamped to [0, 100]; immunity ≥ 100 = fully immune.
 * All are floored at 0 damage.
 */

import type { Defense } from "@/domain/characters/combat/Defense";
import { calculateSelectedReduction, type ReductionType } from "@/domain/characters/combat/Defense";
import type { CombatantRuntime } from "@/domain/combat-lab/engine/CombatState";

export type DamageResolutionConfig =
{
  /** Which defensive layers apply (full = block+parry+dodge+protection+bonus). */
  reductionMode: ReductionType;
};

export const defaultDamageResolution: DamageResolutionConfig =
{
  reductionMode: "full",
};

/**
 * Reduce a raw damage number by a defender's defense. Pure — returns the final
 * damage that should be dealt. `damageIgnoresDefense` (true-type damage) skips
 * every layer.
 */
export function reduceDamage(
  raw: number,
  defense: Defense | undefined,
  config: DamageResolutionConfig,
  damageIgnoresDefense = false,
): number
{
  if (raw <= 0) return 0;
  if (damageIgnoresDefense || !defense) return Math.max(0, Math.round(raw));

  const flatReduction = calculateSelectedReduction(defense, config.reductionMode);
  const afterFlat = raw - flatReduction - defense.resistance;

  if (afterFlat <= 0) return 0;

  const immunityPercent = Math.min(100, Math.max(0, defense.immunity));
  const afterImmunity = afterFlat * (1 - immunityPercent / 100);

  return Math.max(0, Math.round(afterImmunity));
}

/**
 * Subtract damage from a runtime, consuming the barrier pool first, then hp.
 * Mutates the runtime and returns the actual hp remaining afterwards.
 */
export function dealDamage(runtime: CombatantRuntime, amount: number): number
{
  let remaining = Math.max(0, Math.round(amount));

  if (runtime.barrier > 0 && remaining > 0)
  {
    const absorbed = Math.min(runtime.barrier, remaining);
    runtime.barrier -= absorbed;
    remaining -= absorbed;
  }

  runtime.currentHp -= remaining;
  return runtime.currentHp;
}

/** Heal a runtime up to its max hp. Mutates and returns the new hp. */
export function healDamage(runtime: CombatantRuntime, amount: number): number
{
  runtime.currentHp = Math.min(runtime.snapshot.maxHp, runtime.currentHp + Math.max(0, Math.round(amount)));
  return runtime.currentHp;
}
