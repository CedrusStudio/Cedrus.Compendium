/**
 * Damage application against a combatant's barrier + hp pools, plus the
 * defensive reduction model.
 *
 * RULES (source of truth: /rulebook → public/data/rulebook/system-walki.json,
 * sekcja "Defensywa"; see the plan, "Reguły walki z podręcznika"):
 *   - The damage CATEGORY (`DamageType`) selects which reduction layers apply:
 *     zwyczajne→full, blokowane→block, bezpośrednie→direct. śmiertelne /
 *     nieuchronne ignore resistance and reduction entirely.
 *   - Odporność (`resistance`) is subtracted FIRST, per source. Excess → redukcja.
 *   - Redukcja is the ordered sum from `calculateSelectedReduction`. Excess →
 *     barrier, then hp.
 *   - śmiertelne additionally bypasses the barrier (np. trucizna).
 *   - Niewrażliwość (`immunity`) is NOT handled here: it removes attacker dice
 *     at attack-composition time (see rollOffense / resolveAttack).
 * All floored at 0.
 *
 * 1v1 note (per rulebook clarification): resistance and reduction behave the
 * same for a single source — both are flat subtractions. The per-round depleting
 * ("zrywalna") reduction pool only matters with multiple sources (deferred to
 * Scenario Builder / walka grupowa).
 */

import type { Defense } from "@/domain/characters/combat/Defense";
import { calculateSelectedReduction, type ReductionType } from "@/domain/characters/combat/Defense";
import type { CombatantRuntime } from "@/domain/combat-lab/engine/CombatState";
import type { DamageType } from "@/domain/combat-lab/effects/Effect";

/** Map a damage category to the reduction layers it must pass through. */
export function reductionModeFor(damageType: DamageType): ReductionType
{
  switch (damageType)
  {
    case "zwyczajne":
      return "full";
    case "blokowane":
      return "block";
    case "bezpośrednie":
      return "direct";
    // śmiertelne / nieuchronne never reach here (they bypass reduction).
    default:
      return "direct";
  }
}

/** śmiertelne + nieuchronne ignore resistance and reduction. */
export function bypassesDefense(damageType: DamageType): boolean
{
  return damageType === "śmiertelne" || damageType === "nieuchronne";
}

/** Only śmiertelne bypasses the barrier pool. */
export function bypassesBarrier(damageType: DamageType): boolean
{
  return damageType === "śmiertelne";
}

/**
 * Apply damage multipliers (procent / mnożnik) to a post-reduction amount. Each
 * multiplier is folded sequentially with its own rounding; multipliers of the
 * same target thus compound. Default rounding is "up" (podręcznik). Floored ≥ 0.
 */
export function applyDamageMultipliers(
  amount: number,
  multipliers: { factor: number; rounding: "up" | "down" | "nearest" }[],
): number
{
  let value = amount;
  for (const m of multipliers)
  {
    const scaled = value * m.factor;
    value = m.rounding === "down" ? Math.floor(scaled) : m.rounding === "nearest" ? Math.round(scaled) : Math.ceil(scaled);
  }
  return Math.max(0, value);
}

/**
 * Halve the active guard layers (block/parry/dodge, floored) — the defensive
 * side of Oszołomienie (stagger). Armor/unique reduction and resistance are
 * unaffected. Returns a copy; the input is not mutated.
 */
export function halveGuards(defense: Defense): Defense
{
  return {
    ...defense,
    block: Math.floor(defense.block / 2),
    parry: Math.floor(defense.parry / 2),
    dodge: Math.floor(defense.dodge / 2),
  };
}

/**
 * Reduce a raw damage number by a defender's defense following the rulebook
 * order (resistance first, then category-selected reduction). Pure.
 */
export function reduceDamage(raw: number, defense: Defense | undefined, damageType: DamageType): number
{
  if (raw <= 0) return 0;
  if (bypassesDefense(damageType) || !defense) return Math.max(0, Math.round(raw));

  // 1) Odporność — absorbed first, per source.
  const afterResistance = raw - Math.max(0, defense.resistance);
  if (afterResistance <= 0) return 0;

  // 2) Redukcja — ordered layers selected by the damage category.
  const reduction = calculateSelectedReduction(defense, reductionModeFor(damageType));
  return Math.max(0, Math.round(afterResistance - reduction));
}

/**
 * Subtract damage from a runtime, consuming the barrier pool first (unless
 * bypassed), then hp. Mutates the runtime and returns the hp remaining.
 */
export function dealDamage(runtime: CombatantRuntime, amount: number, bypassBarrier = false): number
{
  let remaining = Math.max(0, Math.round(amount));

  if (!bypassBarrier && runtime.barrier > 0 && remaining > 0)
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
