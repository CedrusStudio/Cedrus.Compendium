/**
 * Aggregate many `RawResult`s into a `SimulationSummary`. Kept separate from the
 * run loop so that parallel workers can each return a chunk of `RawResult[]` and
 * the main thread merges them by simple concatenation before aggregating — the
 * engine's determinism makes chunking safe (see plan, architecture).
 */

import type { CombatEndReason } from "@/domain/combat-lab/engine/CombatLog";
import type { RawResult, SimulationSummary } from "@/domain/combat-lab/simulation/RawResult";

const emptyReasons = (): Record<CombatEndReason, number> => ({
  knockout: 0,
  lethal: 0,
  timeout: 0,
  draw: 0,
});

export function aggregateResults(results: RawResult[]): SimulationSummary
{
  const count = results.length;
  const winCounts: Record<string, number> = {};
  const reasons = emptyReasons();
  const deathCauses: Record<string, number> = {};
  const maneuverUsage: Record<string, number> = {};
  const spellUsage: Record<string, number> = {};

  let draws = 0;
  let roundsTotal = 0;
  let winnerHpTotal = 0;
  let decisiveCount = 0;

  for (const result of results)
  {
    roundsTotal += result.rounds;
    reasons[result.reason] += 1;
    deathCauses[result.deathCause] = (deathCauses[result.deathCause] ?? 0) + 1;

    for (const [name, uses] of Object.entries(result.maneuverUsage))
    {
      maneuverUsage[name] = (maneuverUsage[name] ?? 0) + uses;
    }

    for (const [name, uses] of Object.entries(result.spellUsage ?? {}))
    {
      spellUsage[name] = (spellUsage[name] ?? 0) + uses;
    }

    if (result.winnerId)
    {
      winCounts[result.winnerId] = (winCounts[result.winnerId] ?? 0) + 1;
      if (result.winnerRemainingHp !== null)
      {
        winnerHpTotal += result.winnerRemainingHp;
        decisiveCount += 1;
      }
    }
    else
    {
      draws += 1;
    }
  }

  const winRates: Record<string, number> = {};
  for (const [id, wins] of Object.entries(winCounts))
  {
    winRates[id] = count > 0 ? wins / count : 0;
  }

  return {
    count,
    winRates,
    draws,
    averageRounds: count > 0 ? roundsTotal / count : 0,
    averageWinnerHp: decisiveCount > 0 ? winnerHpTotal / decisiveCount : 0,
    reasons,
    deathCauses,
    maneuverUsage,
    mostUsedManeuver: pickMostUsed(maneuverUsage),
    spellUsage,
    mostUsedSpell: pickMostUsed(spellUsage),
    schemaVersion: 1,
  };
}

function pickMostUsed(usage: Record<string, number>): string | null
{
  let best: string | null = null;
  let bestCount = -1;
  // Deterministic: on ties, the lexicographically smaller name wins.
  for (const name of Object.keys(usage).sort())
  {
    if (usage[name]! > bestCount)
    {
      best = name;
      bestCount = usage[name]!;
    }
  }
  return best;
}
