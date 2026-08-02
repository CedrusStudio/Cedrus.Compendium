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

/**
 * How a stance/state fares across the roster: every build wearing it, averaged.
 * Costs no extra fights — it re-slices the ranking that was computed anyway —
 * and answers the question authoring effects was for: is this stance worth it?
 */
export type ModeMetaEntry = { name: string; builds: number; averageWinRate: number };

export type MetaReport =
{
  ranking: MetaRankEntry[];
  mostUsedManeuvers: ManeuverCount[];
  neverUsedManeuvers: string[];
  /** Cast counts across all fights, most-cast first. */
  mostUsedSpells: ManeuverCount[];
  /** Spells present on the roster but never cast in practice. */
  neverUsedSpells: string[];
  /** Stances worn by the roster, ranked by the average win rate of their wearers. */
  stanceRanking: ModeMetaEntry[];
  /** Same for states. */
  stateRanking: ModeMetaEntry[];
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
  const spellUsage: Record<string, number> = {};

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

      for (const [name, uses] of Object.entries(summary.spellUsage ?? {}))
      {
        spellUsage[name] = (spellUsage[name] ?? 0) + uses;
      }

      done += 1;
      onProgress?.(done, total);
    }
  }

  const ranking: MetaRankEntry[] = entries
    .map((entry, i) => ({ id: entry.snapshot.id, name: entry.snapshot.name, averageWinRate: roleCount[i] ? winSum[i]! / roleCount[i]! : 0 }))
    .sort((a, b) => b.averageWinRate - a.averageWinRate || a.name.localeCompare(b.name));

  const available = new Set<string>();
  const availableSpells = new Set<string>();
  for (const entry of entries)
  {
    for (const maneuver of entry.snapshot.maneuvers) available.add(maneuver.name);
    for (const spell of entry.snapshot.spells) availableSpells.add(spell.name);
  }

  const toCounts = (map: Record<string, number>): ManeuverCount[] => Object.entries(map)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([name, count]) => ({ name, count }));

  const mostUsedManeuvers = toCounts(usage);
  const neverUsedManeuvers = [...available].filter(name => !(usage[name] > 0)).sort();
  const mostUsedSpells = toCounts(spellUsage);
  const neverUsedSpells = [...availableSpells].filter(name => !(spellUsage[name] > 0)).sort();

  const winRateById = new Map(ranking.map(entry => [entry.id, entry.averageWinRate] as const));

  return {
    ranking,
    mostUsedManeuvers,
    neverUsedManeuvers,
    mostUsedSpells,
    neverUsedSpells,
    stanceRanking: rankModes(entries, winRateById, "stance"),
    stateRanking: rankModes(entries, winRateById, "state"),
    totalFights: total * options.count,
    count: options.count,
  };
}

/** Average the builds' win rates per stance/state name (builds without one are skipped). */
function rankModes(entries: MatchupEntry[], winRateById: Map<string, number>, slot: "stance" | "state"): ModeMetaEntry[]
{
  const sums = new Map<string, { total: number; builds: number }>();

  for (const entry of entries)
  {
    const mode = entry.snapshot[slot];
    if (!mode) continue;

    const bucket = sums.get(mode.name) ?? { total: 0, builds: 0 };
    bucket.total += winRateById.get(entry.snapshot.id) ?? 0;
    bucket.builds += 1;
    sums.set(mode.name, bucket);
  }

  return [...sums.entries()]
    .map(([name, { total, builds }]) => ({ name, builds, averageWinRate: builds ? total / builds : 0 }))
    .sort((a, b) => b.averageWinRate - a.averageWinRate || a.name.localeCompare(b.name));
}
