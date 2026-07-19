/**
 * Deterministic action-selection policies. The doc is explicit: "AI nie jest
 * wymagane" — combatants follow fixed, explainable strategies, not learned
 * behaviour. Policies are swappable so the Meta Analyzer can study how strategy
 * choice affects balance (v1.0, "dominujące strategie").
 */

import type { Effect, DamageSpec } from "@/domain/combat-lab/effects/Effect";
import type { Offense } from "@/domain/characters/combat/Offense";
import type { CombatantRuntime } from "@/domain/combat-lab/engine/CombatState";
import type { Action } from "@/domain/combat-lab/engine/actionEconomy";
import { selectDefaultOffense } from "@/domain/combat-lab/engine/CombatantSnapshot";

export interface ActionPolicy
{
  readonly name: string;
  /**
   * Choose one action from `available` (never empty — callers pass at least a
   * "pass" fallback). Must be deterministic given identical inputs.
   */
  chooseAction(self: CombatantRuntime, opponent: CombatantRuntime, available: Action[]): Action;
}

/** Average result of a `k(grade*2)` die: (2*grade + 1) / 2. */
function expectedDie(grade: number): number
{
  return grade <= 0 ? 0 : (2 * grade + 1) / 2;
}

function expectedDamageSpec(spec: DamageSpec): number
{
  return spec.amount * expectedDie(spec.grade) + spec.bonus;
}

function expectedOffenseDamage(offense: Offense): number
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

/** Expected direct damage a maneuver's effects produce (chance-weighted). */
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

function scoreAction(self: CombatantRuntime, action: Action): number
{
  if (action.kind === "attack")
  {
    const offense = selectDefaultOffense(self.snapshot);
    return offense ? expectedOffenseDamage(offense) : 0;
  }
  if (action.kind === "maneuver")
  {
    return expectedEffectDamage(action.maneuver.effects);
  }
  return -Infinity;
}

/**
 * Greedy: pick the action with the highest expected damage. Ties are broken
 * deterministically by the action's original order (stable).
 */
export const greedyDamagePolicy: ActionPolicy =
{
  name: "greedyDamage",
  chooseAction(self, _opponent, available)
  {
    let best = available[0]!;
    let bestScore = scoreAction(self, best);
    for (let i = 1; i < available.length; i++)
    {
      const score = scoreAction(self, available[i]!);
      if (score > bestScore)
      {
        best = available[i]!;
        bestScore = score;
      }
    }
    return best;
  },
};

/**
 * Scripted: follow a fixed sequence of maneuver names, falling back to a basic
 * attack when the next scripted maneuver is unavailable. Cycles on repeat.
 */
export function scriptedPolicy(sequence: string[]): ActionPolicy
{
  let step = 0;
  return {
    name: "scripted",
    chooseAction(_self, _opponent, available)
    {
      if (sequence.length > 0)
      {
        const wanted = sequence[step % sequence.length]!;
        step++;
        const match = available.find(a => a.kind === "maneuver" && a.maneuver.name === wanted);
        if (match) return match;
      }
      return available.find(a => a.kind === "attack") ?? available[0]!;
    },
  };
}

/** Always throws a basic attack (or the first available action). */
export const basicAttackPolicy: ActionPolicy =
{
  name: "basicAttack",
  chooseAction(_self, _opponent, available)
  {
    return available.find(a => a.kind === "attack") ?? available[0]!;
  },
};
