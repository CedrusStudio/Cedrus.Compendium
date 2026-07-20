"use client";

/**
 * Shared read-only view of a `SimulationSummary` — used both right after a run
 * and when reopening a saved run.
 */

import type { SimulationSummary } from "@/domain/combat-lab/simulation/RawResult";
import { Card, CardContent, CardHeader, CardTitle } from "@/common/components/ui/card";

export type SimulationSummaryViewProps =
{
  summary: SimulationSummary;
  nameA: string;
  nameB: string;
  idA: string;
  idB: string;
};

export function SimulationSummaryView({ summary, nameA, nameB, idA, idB }: SimulationSummaryViewProps)
{
  const pct = (v: number | undefined) => `${((v ?? 0) * 100).toFixed(1)}%`;
  return (
    <Card>
      <CardHeader><CardTitle className="text-base">Wyniki ({summary.count} walk)</CardTitle></CardHeader>
      <CardContent className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Stat label={`Win Rate — ${nameA}`} value={pct(summary.winRates[idA])} />
        <Stat label={`Win Rate — ${nameB}`} value={pct(summary.winRates[idB])} />
        <Stat label="Remisy" value={`${summary.draws}`} />
        <Stat label="Śr. liczba rund" value={summary.averageRounds.toFixed(1)} />
        <Stat label="Śr. HP zwycięzcy" value={summary.averageWinnerHp.toFixed(1)} />
        <Stat label="Najczęstszy manewr" value={summary.mostUsedManeuver ?? "—"} />
      </CardContent>
    </Card>
  );
}

function Stat({ label, value }: { label: string; value: string })
{
  return (
    <div className="rounded border p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-lg font-semibold tabular-nums">{value}</div>
    </div>
  );
}
