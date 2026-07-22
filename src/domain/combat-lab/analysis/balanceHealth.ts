/**
 * Balance health: an interpretation layer over the Meta round-robin. Turns the
 * raw ranking + maneuver usage into an at-a-glance verdict — how balanced the
 * roster is, which builds are over/under-powered, which maneuvers dominate, and
 * how many are dead. Pure and deterministic; no simulation of its own.
 */

import type { MetaReport, MetaRankEntry } from "@/domain/combat-lab/analysis/meta";

export type BalanceHealth =
{
  /** 0..100 — 100 = every build sits near a 50% win rate. */
  score: number;
  verdict: "zdrowy" | "umiarkowany" | "niezbalansowany";
  /** Mean absolute deviation of average win rate from 0.5 (0 = perfect). */
  dispersion: number;
  overpowered: MetaRankEntry[];
  underpowered: MetaRankEntry[];
  /** Most-used maneuvers with their share of all usage (over-reliance signal). */
  dominantManeuvers: { name: string; share: number }[];
  deadManeuverCount: number;
};

export type BalanceHealthOptions =
{
  /** Win-rate distance from 0.5 above which a build is flagged (default 0.15). */
  outlierThreshold?: number;
  /** How many top maneuvers to report as "dominant" (default 3). */
  dominantTop?: number;
};

export function computeBalanceHealth(report: MetaReport, options: BalanceHealthOptions = {}): BalanceHealth
{
  const threshold = options.outlierThreshold ?? 0.15;
  const top = options.dominantTop ?? 3;

  const ranking = report.ranking;
  const deviations = ranking.map(r => Math.abs(r.averageWinRate - 0.5));
  const dispersion = deviations.length > 0 ? deviations.reduce((s, d) => s + d, 0) / deviations.length : 0;

  const score = Math.round(clamp(100 - dispersion * 300, 0, 100));
  const verdict: BalanceHealth["verdict"] = score >= 75 ? "zdrowy" : score >= 50 ? "umiarkowany" : "niezbalansowany";

  const overpowered = ranking.filter(r => r.averageWinRate > 0.5 + threshold);
  const underpowered = [...ranking].filter(r => r.averageWinRate < 0.5 - threshold).reverse();

  const totalUses = report.mostUsedManeuvers.reduce((s, m) => s + m.count, 0);
  const dominantManeuvers = report.mostUsedManeuvers
    .slice(0, top)
    .map(m => ({ name: m.name, share: totalUses > 0 ? m.count / totalUses : 0 }));

  return {
    score,
    verdict,
    dispersion,
    overpowered,
    underpowered,
    dominantManeuvers,
    deadManeuverCount: report.neverUsedManeuvers.length,
  };
}

function clamp(v: number, lo: number, hi: number): number
{
  return Math.max(lo, Math.min(hi, v));
}
