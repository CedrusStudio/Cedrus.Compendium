/**
 * CSV serialization for Combat Lab data. Pure, dependency-free (RFC-4180-style
 * escaping) — the UI just triggers a download of the returned string.
 */

import type { RawResult } from "@/domain/combat-lab/simulation/RawResult";
import type { MatchupMatrix } from "@/domain/combat-lab/analysis/matchup";
import type { MetaReport } from "@/domain/combat-lab/analysis/meta";
import type { ScenarioReport } from "@/domain/combat-lab/scenario/scenario";

export type CsvValue = string | number | boolean | null | undefined;

function escapeField(value: CsvValue): string
{
  if (value === null || value === undefined) return "";
  const s = String(value);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/** Serialize a grid of rows to a CSV string (rows joined by \n). */
export function toCsv(rows: CsvValue[][]): string
{
  return rows.map(row => row.map(escapeField).join(",")).join("\n");
}

/** Serialize objects to CSV given ordered columns. */
export function objectsToCsv<T>(objects: T[], columns: { key: keyof T; header: string }[]): string
{
  const header = columns.map(c => c.header);
  const body = objects.map(o => columns.map(c => o[c.key] as CsvValue));
  return toCsv([header, ...body]);
}

// --- Combat Lab specific serializers ---

export function rawResultsToCsv(results: RawResult[]): string
{
  return objectsToCsv(results, [
    { key: "seed", header: "seed" },
    { key: "winnerId", header: "winner" },
    { key: "reason", header: "reason" },
    { key: "rounds", header: "rounds" },
    { key: "winnerRemainingHp", header: "winnerHp" },
    { key: "deathCause", header: "deathCause" },
  ]);
}

export function matchupToCsv(matrix: MatchupMatrix): string
{
  const header: CsvValue[] = ["A \\ B", ...matrix.combatants.map(c => c.name)];
  const rows: CsvValue[][] = matrix.combatants.map((rowC, i) => [
    rowC.name,
    ...matrix.combatants.map((_, j) => {
      const v = matrix.winRates[i]?.[j];
      return v === null || v === undefined ? "" : Number((v * 100).toFixed(1));
    }),
  ]);
  return toCsv([header, ...rows]);
}

export function metaRankingToCsv(report: MetaReport): string
{
  const header: CsvValue[] = ["rank", "name", "averageWinRate%"];
  const rows: CsvValue[][] = report.ranking.map((e, i) => [i + 1, e.name, Number((e.averageWinRate * 100).toFixed(1))]);
  return toCsv([header, ...rows]);
}

export function scenarioReportToCsv(report: ScenarioReport): string
{
  const header: CsvValue[] = ["scenario", `winRate_${report.aName}%`, `winRate_${report.bName}%`, "draws", "avgRounds"];
  const rows: CsvValue[][] = report.rows.map(r => [
    r.scenarioName,
    Number((r.winRateA * 100).toFixed(1)),
    Number((r.winRateB * 100).toFixed(1)),
    r.draws,
    Number(r.averageRounds.toFixed(2)),
  ]);
  return toCsv([header, ...rows]);
}
