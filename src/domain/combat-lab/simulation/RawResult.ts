/**
 * Per-fight outcome extracted from a `CombatLog`, and the aggregated summary
 * over many fights. These are the "Results" entity from the doc — the raw
 * material every analyser (Balance, Matchup, Statistics…) consumes.
 *
 * Pure domain, serializable, versioned so persisted results survive format
 * changes.
 */

import type { CombatEndReason } from "@/domain/combat-lab/engine/CombatLog";
import type { StatusId } from "@/domain/combat-lab/effects/Effect";

/** What ultimately felled the loser. */
export type DeathCause = "weapon" | "ability" | StatusId | "none";

export type RawResult =
{
  seed: number;
  winnerId: string | null;
  reason: CombatEndReason;
  rounds: number;
  /** Winner's hp at the end (null on draw/timeout with no winner). */
  winnerRemainingHp: number | null;
  deathCause: DeathCause;
  /** How many times each maneuver (by name) was used across the whole fight. */
  maneuverUsage: Record<string, number>;
  schemaVersion: 1;
};

export type SimulationSummary =
{
  count: number;
  /** Combatant id → fraction of fights won (0..1). */
  winRates: Record<string, number>;
  draws: number;
  averageRounds: number;
  /** Mean winner remaining hp across decisive fights. */
  averageWinnerHp: number;
  /** End-reason histogram. */
  reasons: Record<CombatEndReason, number>;
  /** Death-cause histogram. */
  deathCauses: Record<string, number>;
  /** Aggregate maneuver usage across all fights. */
  maneuverUsage: Record<string, number>;
  /** Most-used maneuver name (null if none used). */
  mostUsedManeuver: string | null;
  schemaVersion: 1;
};
