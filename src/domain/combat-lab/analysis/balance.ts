/**
 * Balance Analyzer: a static "build profile" of each combatant across the
 * dimensions the doc lists (damage, survivability, control, economy, utility,
 * mobility), normalized across the roster, plus an overall score and ranking.
 *
 * Static (no simulation) — derived from the snapshot + its maneuver effects, so
 * it's instant. For a fight-outcome ranking use the Matchup Analyzer (win rates).
 * Pure domain, chart-agnostic.
 */

import type { CombatantSnapshot } from "@/domain/combat-lab/engine/CombatantSnapshot";
import { selectDefaultOffense, selectDefaultDefense } from "@/domain/combat-lab/engine/CombatantSnapshot";
import { flattenEffects } from "@/domain/combat-lab/effects/Effect";
import { expectedOffenseDamage, expectedEffectDamage, expectedDamageSpec } from "@/domain/combat-lab/engine/ai/expectedDamage";
import { calculateSelectedReduction } from "@/domain/characters/combat/Defense";
import { getStatisticTotalTestValue } from "@/domain/characters/statistics/Statistic";

export type BalanceDimension = "damage" | "survivability" | "control" | "economy" | "utility" | "mobility";

export const BALANCE_DIMENSIONS: BalanceDimension[] = ["damage", "survivability", "control", "economy", "utility", "mobility"];

export type BalanceProfile = Record<BalanceDimension, number>;

export type BalanceEntry =
{
  id: string;
  name: string;
  raw: BalanceProfile;
  /** Each dimension scaled 0–100 relative to the roster max. */
  normalized: BalanceProfile;
  /** Mean of the normalized dimensions (0–100) — the ranking key. */
  score: number;
};

export type BalanceReport =
{
  entries: BalanceEntry[];
};

const CONTROL_WEIGHT: Record<string, number> = { stun: 1, disarm: 0.8, silence: 0.5, root: 0.2 };

/** Raw (un-normalized) dimension scores for a single combatant. */
export function computeRawProfile(snapshot: CombatantSnapshot): BalanceProfile
{
  const offense = selectDefaultOffense(snapshot);
  const defense = selectDefaultDefense(snapshot);
  const attackDamage = offense ? expectedOffenseDamage(offense) : 0;

  const maneuverEffects = snapshot.maneuvers.flatMap(m => flattenEffects(m.effects));

  let maneuverDamage = 0;
  let control = 0;
  let utility = 0;
  let mobility = 0;

  for (const effect of maneuverEffects)
  {
    switch (effect.type)
    {
      case "damage": maneuverDamage += expectedDamageSpec(effect.damage); break;
      case "status":
        if (effect.tick) maneuverDamage += expectedDamageSpec(effect.tick.damage) * Math.max(1, effect.duration);
        else control += 0.5 * Math.max(1, effect.duration);
        break;
      case "control": control += (CONTROL_WEIGHT[effect.control] ?? 0.2) * Math.max(1, effect.duration); break;
      case "heal": utility += expectedDamageSpec(effect.amount); break;
      case "buff": case "debuff": utility += 5; break;
      case "resource": utility += 2; break;
      case "push": case "pull": mobility += effect.distance; break;
      default: break;
    }
  }

  const reduction = defense ? calculateSelectedReduction(defense, "full") : 0;

  return {
    damage: attackDamage + maneuverDamage,
    survivability: snapshot.maxHp + snapshot.barrier + reduction,
    control,
    // Burst-per-turn: the (independent) attack plus the best usable maneuver.
    economy: attackDamage + bestManeuverDamage(snapshot),
    utility,
    mobility: getStatisticTotalTestValue(snapshot.initiative) + mobility,
  };
}

function bestManeuverDamage(snapshot: CombatantSnapshot): number
{
  let best = 0;
  for (const maneuver of snapshot.maneuvers)
  {
    best = Math.max(best, expectedEffectDamage(maneuver.effects));
  }
  return best;
}

/** Build the report: raw profiles, per-dimension normalization, score, ranking. */
export function computeBalanceReport(snapshots: CombatantSnapshot[]): BalanceReport
{
  const raws = snapshots.map(computeRawProfile);

  const maxByDim = {} as BalanceProfile;
  for (const dim of BALANCE_DIMENSIONS)
  {
    maxByDim[dim] = Math.max(0, ...raws.map(r => r[dim]));
  }

  const entries: BalanceEntry[] = snapshots.map((snapshot, i) =>
  {
    const raw = raws[i]!;
    const normalized = {} as BalanceProfile;
    for (const dim of BALANCE_DIMENSIONS)
    {
      normalized[dim] = maxByDim[dim] > 0 ? (raw[dim] / maxByDim[dim]) * 100 : 0;
    }
    const score = BALANCE_DIMENSIONS.reduce((sum, dim) => sum + normalized[dim], 0) / BALANCE_DIMENSIONS.length;
    return { id: snapshot.id, name: snapshot.name, raw, normalized, score };
  });

  entries.sort((a, b) => b.score - a.score || a.name.localeCompare(b.name));
  return { entries };
}
