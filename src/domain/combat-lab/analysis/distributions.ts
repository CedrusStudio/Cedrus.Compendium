/**
 * Statistics: distributions computed from a run's `RawResult[]`. Pure domain,
 * chart-agnostic — returns plain `{ label, count }`-style series the UI feeds to
 * any chart library. Uses only what `RawResult` already carries (rounds, winner
 * hp, death cause, end reason, maneuver usage); per-event stats like crit/dodge
 * rates would need a richer `RawResult` (future).
 */

import type { RawResult } from "@/domain/combat-lab/simulation/RawResult";
import type { CombatEndReason } from "@/domain/combat-lab/engine/CombatLog";

export type CountBucket = { label: string; count: number };

export type SimulationStatistics =
{
  /** Fights grouped by exact round count (ascending). */
  rounds: CountBucket[];
  /** Winner remaining-hp binned into ranges. */
  winnerHp: CountBucket[];
  /** How the loser died. */
  deathCauses: CountBucket[];
  /** How fights ended (knockout / lethal / timeout / draw). */
  reasons: CountBucket[];
  /** Most-used maneuvers (descending, top N). */
  maneuverUsage: CountBucket[];
  total: number;
};

const REASON_ORDER: CombatEndReason[] = ["knockout", "lethal", "timeout", "draw"];

export function computeStatistics(results: RawResult[], maneuverTopN = 10): SimulationStatistics
{
  return {
    rounds: roundsDistribution(results),
    winnerHp: winnerHpDistribution(results),
    deathCauses: countBy(results.map(r => r.deathCause)),
    reasons: reasonsDistribution(results),
    maneuverUsage: maneuverUsageTop(results, maneuverTopN),
    total: results.length,
  };
}

function roundsDistribution(results: RawResult[]): CountBucket[]
{
  const counts = new Map<number, number>();
  for (const r of results) counts.set(r.rounds, (counts.get(r.rounds) ?? 0) + 1);
  return [...counts.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([round, count]) => ({ label: String(round), count }));
}

function winnerHpDistribution(results: RawResult[], bins = 8): CountBucket[]
{
  const values = results.map(r => r.winnerRemainingHp).filter((v): v is number => v !== null);
  if (values.length === 0) return [];

  const min = Math.min(...values);
  const max = Math.max(...values);
  if (min === max) return [{ label: String(min), count: values.length }];

  const width = (max - min) / bins;
  const buckets: CountBucket[] = Array.from({ length: bins }, (_, i) =>
  {
    const start = Math.round(min + i * width);
    const end = Math.round(min + (i + 1) * width);
    return { label: `${start}–${end}`, count: 0 };
  });

  for (const value of values)
  {
    const index = Math.min(bins - 1, Math.floor((value - min) / width));
    buckets[index]!.count += 1;
  }
  return buckets;
}

function reasonsDistribution(results: RawResult[]): CountBucket[]
{
  const counts: Record<string, number> = {};
  for (const r of results) counts[r.reason] = (counts[r.reason] ?? 0) + 1;
  return REASON_ORDER.filter(reason => counts[reason]).map(reason => ({ label: reason, count: counts[reason]! }));
}

function maneuverUsageTop(results: RawResult[], topN: number): CountBucket[]
{
  const usage: Record<string, number> = {};
  for (const r of results)
  {
    for (const [name, uses] of Object.entries(r.maneuverUsage))
    {
      usage[name] = (usage[name] ?? 0) + uses;
    }
  }
  return Object.entries(usage)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, topN)
    .map(([name, count]) => ({ label: name, count }));
}

function countBy(values: string[]): CountBucket[]
{
  const counts: Record<string, number> = {};
  for (const v of values) counts[v] = (counts[v] ?? 0) + 1;
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([label, count]) => ({ label, count }));
}
