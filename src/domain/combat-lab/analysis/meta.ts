/**
 * Meta Analyzer: after a big round-robin over a roster, surface the "meta" —
 * best/worst builds (by average win rate across all matchups), the most-used
 * maneuvers, and the maneuvers never picked (dead in practice).
 *
 * One pass over all ordered pairs; each combatant is scored both as attacker (A)
 * and defender (B). Reuses `SimulationSummary.maneuverUsage` (already aggregated
 * per pair) so no extra bookkeeping is needed. Pure domain, deterministic.
 */

import type { MatchupEntry } from "@/domain/combat-lab/analysis/matchup";
import { runSimulation } from "@/domain/combat-lab/simulation/runSimulation";

export type MetaRankEntry = { id: string; name: string; averageWinRate: number };
export type ManeuverCount = { name: string; count: number };

export type MetaReport =
{
  ranking: MetaRankEntry[];
  mostUsedManeuvers: ManeuverCount[];
  neverUsedManeuvers: string[];
  totalFights: number;
  count: number;
};

export type MetaOptions =
{
  count: number;
  seedStart?: number;
  maxRounds?: number;
};

export function computeMeta(entries: MatchupEntry[], options: MetaOptions, onProgress?: (done: number, total: number) => void): MetaReport
{
  const n = entries.length;
  const winSum = new Array<number>(n).fill(0);
  const roleCount = new Array<number>(n).fill(0);
  const usage: Record<string, number> = {};

  const total = n * (n - 1);
  let done = 0;

  for (let i = 0; i < n; i++)
  {
    for (let j = 0; j < n; j++)
    {
      if (i === j) continue;

      const { summary } = runSimulation({
        a: entries[i]!.snapshot,
        b: entries[j]!.snapshot,
        count: options.count,
        seedStart: options.seedStart ?? 0,
        policyA: entries[i]!.policy,
        policyB: entries[j]!.policy,
        maxRounds: options.maxRounds,
      });

      winSum[i] += summary.winRates[entries[i]!.snapshot.id] ?? 0;
      roleCount[i] += 1;
      winSum[j] += summary.winRates[entries[j]!.snapshot.id] ?? 0;
      roleCount[j] += 1;

      for (const [name, uses] of Object.entries(summary.maneuverUsage))
      {
        usage[name] = (usage[name] ?? 0) + uses;
      }

      done += 1;
      onProgress?.(done, total);
    }
  }

  const ranking: MetaRankEntry[] = entries
    .map((entry, i) => ({ id: entry.snapshot.id, name: entry.snapshot.name, averageWinRate: roleCount[i] ? winSum[i]! / roleCount[i]! : 0 }))
    .sort((a, b) => b.averageWinRate - a.averageWinRate || a.name.localeCompare(b.name));

  const available = new Set<string>();
  for (const entry of entries)
  {
    for (const maneuver of entry.snapshot.maneuvers) available.add(maneuver.name);
  }

  const mostUsedManeuvers = Object.entries(usage)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([name, count]) => ({ name, count }));

  const neverUsedManeuvers = [...available].filter(name => !(usage[name] > 0)).sort();

  return {
    ranking,
    mostUsedManeuvers,
    neverUsedManeuvers,
    totalFights: total * options.count,
    count: options.count,
  };
}
