"use client";

/**
 * Reopen a saved run: load it by id, show its summary, and replay any individual
 * fight — reproduced deterministically from the stored configuration (no logs
 * were persisted).
 */

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import combatLabClient, { type SavedSimulationDto } from "@/infrastructure/clients/combatLabClient";
import { useApiKey } from "@/common/hooks/useApiKey";
import { reproduceFight } from "@/domain/combat-lab/persistence/reproduceFight";
import { SimulationSummaryView } from "@/application/combat-lab/runner/SimulationSummaryView";
import { CombatReplay } from "@/application/combat-lab/replay/CombatReplay";
import { Card, CardContent, CardHeader, CardTitle } from "@/common/components/ui/card";
import { Input } from "@/common/components/ui/input";
import { Label } from "@/common/components/ui/label";
import { Button } from "@/common/components/ui/button";

export function SavedRunView({ id }: { id: string })
{
  const { apiKey } = useApiKey();
  const [seed, setSeed] = useState(0);

  const { data, isLoading, error } = useQuery<SavedSimulationDto>({
    queryKey: ["combat-lab-simulation", id, apiKey ?? ""],
    queryFn: () => combatLabClient.getSimulation(id),
    staleTime: 5_000,
  });

  const replayLog = useMemo(() =>
  {
    if (!data) return null;
    const { configuration } = data;
    const clamped = configuration.seedStart + Math.max(0, Math.min(seed, configuration.count - 1));
    return reproduceFight(configuration, clamped);
  }, [data, seed]);

  if (isLoading) return <p className="text-sm text-muted-foreground">Wczytywanie biegu…</p>;
  if (error || !data) return <p className="text-sm text-destructive">Nie udało się wczytać biegu.</p>;

  const { configuration, result } = data;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold">{data.name}</h2>
          <p className="text-sm text-muted-foreground">
            {configuration.a.name} vs {configuration.b.name} · {configuration.count} walk
          </p>
        </div>
        <Button asChild variant="outline" size="sm">
          <a href={`/combat-lab/report/${id}`} target="_blank" rel="noopener noreferrer">Raport / PDF</a>
        </Button>
      </div>

      <SimulationSummaryView
        summary={result}
        nameA={configuration.a.name}
        nameB={configuration.b.name}
        idA={configuration.a.id}
        idB={configuration.b.id}
      />

      <Card>
        <CardHeader><CardTitle className="text-base">Podgląd pojedynczej walki</CardTitle></CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <Label className="text-xs text-muted-foreground">Seed (0 – {configuration.count - 1})</Label>
            <Input type="number" className="w-32" value={seed} onChange={e => setSeed(Number(e.target.value) || 0)} />
          </div>
          {replayLog && <CombatReplay log={replayLog} />}
        </CardContent>
      </Card>
    </div>
  );
}
