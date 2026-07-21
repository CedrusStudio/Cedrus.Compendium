/**
 * Matchup Analyzer: an N×N win-rate matrix over a set of combatants. For every
 * ordered pair (i as A vs j as B) it runs a full simulation and records i's win
 * rate — answering "which builds have weak matchups?". Ordered (not just upper
 * triangle) because initiative and the A/B role are not symmetric.
 *
 * Pure domain, built on `runSimulation`; deterministic. Heavy for large N × count,
 * so the UI runs it in a worker.
 */

import type { CombatantSnapshot } from "@/domain/combat-lab/engine/CombatantSnapshot";
import type { ActionPolicy } from "@/domain/combat-lab/engine/ai/policy";
import { runSimulation } from "@/domain/combat-lab/simulation/runSimulation";

export type MatchupEntry =
{
  snapshot: CombatantSnapshot;
  policy?: ActionPolicy;
};

export type MatchupCombatant =
{
  id: string;
  name: string;
};

export type MatchupMatrix =
{
  combatants: MatchupCombatant[];
  /**
   * `winRates[i][j]` = fraction of fights combatant i (as A) beat combatant j
   * (as B), in [0, 1]. Diagonal (i === j) is `null`.
   */
  winRates: (number | null)[][];
  count: number;
  schemaVersion: 1;
};

export type MatchupOptions =
{
  count: number;
  seedStart?: number;
  maxRounds?: number;
};

/**
 * Compute the full matrix. `onProgress(done, total)` fires after each pair
 * (total = N*(N-1)).
 */
export function computeMatchupMatrix(
  entries: MatchupEntry[],
  options: MatchupOptions,
  onProgress?: (done: number, total: number) => void,
): MatchupMatrix
{
  const n = entries.length;
  const combatants = entries.map(e => ({ id: e.snapshot.id, name: e.snapshot.name }));
  const winRates: (number | null)[][] = entries.map(() => new Array<number | null>(n).fill(null));

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

      winRates[i]![j] = summary.winRates[entries[i]!.snapshot.id] ?? 0;
      done += 1;
      onProgress?.(done, total);
    }
  }

  return { combatants, winRates, count: options.count, schemaVersion: 1 };
}

/** Average win rate of each combatant across its matchups (row mean, ignoring nulls). */
export function averageWinRates(matrix: MatchupMatrix): number[]
{
  return matrix.winRates.map(row =>
  {
    const values = row.filter((v): v is number => v !== null);
    return values.length === 0 ? 0 : values.reduce((sum, v) => sum + v, 0) / values.length;
  });
}
