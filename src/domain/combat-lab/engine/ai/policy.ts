/**
 * Deterministic action-selection policies. The doc is explicit: "AI nie jest
 * wymagane" — combatants follow fixed, explainable strategies, not learned
 * behaviour. Policies are swappable so the Meta Analyzer can study how strategy
 * choice affects balance (v1.0, "dominujące strategie").
 */

import type { CombatantRuntime } from "@/domain/combat-lab/engine/CombatState";
import type { Action } from "@/domain/combat-lab/engine/actionEconomy";
import { selectDefaultOffense } from "@/domain/combat-lab/engine/CombatantSnapshot";
import { expectedOffenseDamage, expectedEffectDamage } from "@/domain/combat-lab/engine/ai/expectedDamage";
import { expectedManeuverValue } from "@/domain/combat-lab/engine/ai/policyValue";
import { statEffectToProfile } from "@/domain/combat-lab/effects/statBuff";
import { applyOffenseBuff } from "@/domain/characters/buffs/applyBuffProfile";
import type { Effect } from "@/domain/combat-lab/effects/Effect";

export interface ActionPolicy
{
  readonly name: string;
  /**
   * Choose one action from `available` (never empty — callers pass at least a
   * "pass" fallback). Must be deterministic given identical inputs.
   */
  chooseAction(self: CombatantRuntime, opponent: CombatantRuntime, available: Action[]): Action;
}

/** Pick the highest-scoring action; stable on ties (keeps the first / a "pass"). */
function argmax(self: CombatantRuntime, opponent: CombatantRuntime, available: Action[], score: (self: CombatantRuntime, opponent: CombatantRuntime, action: Action) => number): Action
{
  let best = available[0]!;
  let bestScore = score(self, opponent, best);
  for (let i = 1; i < available.length; i++)
  {
    const s = score(self, opponent, available[i]!);
    if (s > bestScore)
    {
      best = available[i]!;
      bestScore = s;
    }
  }
  return best;
}

/**
 * Extra expected damage on THIS turn's attack from a maneuver's self-buffs
 * (stat mode "self" / profile buffs). Lets greedy value a "+2 do najbliższego
 * ataku" maneuver — which it previously ignored (no direct `damage` effect).
 */
function selfOffenseGain(self: CombatantRuntime, effects: Effect[]): number
{
  const offense = selectDefaultOffense(self.snapshot);
  if (!offense) return 0;
  const base = expectedOffenseDamage(offense);
  let gain = 0;
  for (const effect of effects)
  {
    const profile = effect.type === "stat" && effect.mode === "self"
      ? statEffectToProfile(effect)
      : effect.type === "buff"
        ? self.snapshot.buffProfiles.find(p => p.id === effect.profile.profileId)
        : undefined;
    if (profile) gain += Math.max(0, expectedOffenseDamage(applyOffenseBuff(offense, profile)) - base);
  }
  return gain;
}

function damageScore(self: CombatantRuntime, _opponent: CombatantRuntime, action: Action): number
{
  if (action.kind === "attack" || action.kind === "ranged")
  {
    const offense = selectDefaultOffense(self.snapshot);
    return offense ? expectedOffenseDamage(offense) : 0;
  }
  if (action.kind === "maneuver")
  {
    // Direct damage PLUS the extra attack damage from any self-buffs it applies.
    return expectedEffectDamage(action.maneuver.effects) + selfOffenseGain(self, action.maneuver.effects);
  }
  if (action.kind === "spell")
  {
    // A spell replaces the attack — score it by its own expected damage.
    return expectedOffenseDamage(action.spell.offense);
  }
  // "pass" scores 0 so a maneuver with no expected value is declined.
  return 0;
}

function valueScore(self: CombatantRuntime, opponent: CombatantRuntime, action: Action): number
{
  if (action.kind === "attack" || action.kind === "ranged")
  {
    const offense = selectDefaultOffense(self.snapshot);
    return offense ? expectedOffenseDamage(offense) : 0;
  }
  if (action.kind === "maneuver")
  {
    return expectedManeuverValue(self, opponent, action.maneuver.effects);
  }
  if (action.kind === "spell")
  {
    return expectedOffenseDamage(action.spell.offense);
  }
  return 0;
}

/**
 * Greedy: pick the action with the highest expected DAMAGE. Ignores the value of
 * buffs/control/heal (use `valuePolicy` for that).
 */
export const greedyDamagePolicy: ActionPolicy =
{
  name: "greedyDamage",
  chooseAction(self, opponent, available)
  {
    return argmax(self, opponent, available, damageScore);
  },
};

/**
 * Value policy: like greedy, but scores maneuvers by a broader heuristic that
 * also credits buffs (offense/defense gains), debuffs, control (denying the
 * opponent actions), and healing (capped at missing hp) — see policyValue.ts.
 * This is what makes defensive maneuvers and defensive REACTIONS actually fire.
 */
export const valuePolicy: ActionPolicy =
{
  name: "value",
  chooseAction(self, opponent, available)
  {
    return argmax(self, opponent, available, valueScore);
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
