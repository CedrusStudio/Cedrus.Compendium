"use client";

/**
 * Win-rate heatmap for a `MatchupMatrix`. Rows = combatant as attacker (A),
 * columns = opponent (B); each cell shows A's win% vs B, coloured red→amber→green.
 * Custom grid (no charting dependency — recharts has no heatmap primitive).
 */

import type { MatchupMatrix } from "@/domain/combat-lab/analysis/matchup";
import { averageWinRates } from "@/domain/combat-lab/analysis/matchup";

export function MatchupHeatmap({ matrix }: { matrix: MatchupMatrix })
{
  const { combatants, winRates } = matrix;
  const averages = averageWinRates(matrix);

  return (
    <div className="overflow-x-auto">
      <table className="border-collapse text-sm">
        <thead>
          <tr>
            <th className="p-2 text-left text-xs text-muted-foreground">A ↓ / B →</th>
            {combatants.map(c => (
              <th key={c.id} className="p-2 text-center align-bottom text-xs font-medium">{c.name}</th>
            ))}
            <th className="p-2 text-center text-xs text-muted-foreground">śr.</th>
          </tr>
        </thead>
        <tbody>
          {combatants.map((rowC, i) => (
            <tr key={rowC.id}>
              <th className="whitespace-nowrap p-2 text-left text-xs font-medium">{rowC.name}</th>
              {combatants.map((colC, j) => {
                const value = winRates[i]?.[j] ?? null;
                return (
                  <td
                    key={colC.id}
                    className="p-2 text-center tabular-nums"
                    style={value === null ? undefined : { backgroundColor: cellColor(value), color: textColor(value) }}
                    title={value === null ? "" : `${rowC.name} vs ${colC.name}: ${(value * 100).toFixed(1)}%`}
                  >
                    {value === null ? "—" : `${(value * 100).toFixed(0)}%`}
                  </td>
                );
              })}
              <td className="p-2 text-center font-semibold tabular-nums">{`${(averages[i]! * 100).toFixed(0)}%`}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-2 text-xs text-muted-foreground">
        Zielony = wysoki Win Rate atakującego (A) w danym starciu, czerwony = niski. Ostatnia kolumna: średni Win Rate w matchupach.
      </p>
    </div>
  );
}

/** Red (0%) → amber (50%) → green (100%). */
function cellColor(winRate: number): string
{
  const hue = Math.max(0, Math.min(120, winRate * 120)); // 0 = red, 120 = green
  return `hsl(${hue}, 70%, 45%)`;
}

function textColor(winRate: number): string
{
  // Mid values (amber) are lightest → use dark text there; extremes → white.
  return winRate > 0.25 && winRate < 0.75 ? "hsl(0 0% 10%)" : "hsl(0 0% 100%)";
}
