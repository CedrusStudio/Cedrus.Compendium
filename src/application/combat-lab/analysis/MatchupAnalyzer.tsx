"use client";

/**
 * Matchup Analyzer UI: assemble a roster of combatants (each with its own attack
 * mode + per-simulation buffs), run every pairing in a worker, and read the
 * win-rate heatmap.
 */

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { X } from "lucide-react";
import { CombatantPicker } from "@/application/combat-lab/builder/CombatantPicker";
import { buildSnapshotFromSelection, type CombatantSelection } from "@/application/combat-lab/builder/combatantSelection";
import { useCharactersByIds } from "@/application/combat-lab/hooks/useCharactersByIds";
import { useMatchup } from "@/application/combat-lab/hooks/useMatchup";
import { MatchupHeatmap } from "@/application/combat-lab/analysis/MatchupHeatmap";
import type { PolicySpec } from "@/application/combat-lab/worker/simulationMessages";
import { Button } from "@/common/components/ui/button";
import { Input } from "@/common/components/ui/input";
import { Label } from "@/common/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/common/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/common/components/ui/select";

type PolicyName = "value" | "greedyDamage" | "basicAttack";
const POLICY_LABELS: Record<PolicyName, string> = {
  value: "Wartościująca",
  greedyDamage: "Zachłanna",
  basicAttack: "Podstawowy atak",
};

export function MatchupAnalyzer()
{
  const [roster, setRoster] = useState<CombatantSelection[]>([]);
  const [draft, setDraft] = useState<CombatantSelection | null>(null);
  const [count, setCount] = useState(500);
  const [policy, setPolicy] = useState<PolicyName>("value");

  const { byId, isLoading } = useCharactersByIds(useMemo(() => roster.map(r => r.characterId), [roster]));
  const { run, isRunning, progress, matrix } = useMatchup();

  const allLoaded = roster.length >= 2 && roster.every(r => byId.has(r.characterId));

  const addDraft = () =>
  {
    if (!draft) return;
    if (roster.some(r => r.characterId === draft.characterId))
    {
      toast.error("Ta postać jest już w macierzy.");
      return;
    }
    setRoster(prev => [...prev, draft]);
    setDraft(null);
  };

  const removeEntry = (characterId: string) => setRoster(prev => prev.filter(r => r.characterId !== characterId));

  const handleRun = async () =>
  {
    if (!allLoaded) return;
    const spec: PolicySpec = { name: policy };
    const entries = roster.map(sel => ({
      snapshot: buildSnapshotFromSelection(byId.get(sel.characterId)!, sel),
      policy: spec,
    }));

    try
    {
      await run({ entries, count, seedStart: 0 });
    }
    catch (error)
    {
      toast.error(error instanceof Error ? error.message : "Obliczenie macierzy nie powiodło się.");
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader><CardTitle className="text-base">Roster ({roster.length})</CardTitle></CardHeader>
        <CardContent className="flex flex-col gap-3">
          {roster.length > 0 && (
            <ul className="flex flex-wrap gap-2">
              {roster.map(entry => (
                <li key={entry.characterId} className="flex items-center gap-1 rounded border px-2 py-1 text-sm">
                  <span>{entry.characterName}</span>
                  <button type="button" onClick={() => removeEntry(entry.characterId)} aria-label="Usuń z macierzy" className="text-muted-foreground hover:text-destructive">
                    <X className="size-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          )}
          <div className="flex flex-wrap items-start gap-3">
            <CombatantPicker title="Dodaj postać" value={draft} onChange={setDraft} />
            <Button variant="outline" disabled={!draft} onClick={addDraft} className="mt-8">Dodaj do macierzy</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Parametry</CardTitle></CardHeader>
        <CardContent className="flex flex-wrap items-end gap-4">
          <div className="flex flex-col gap-1">
            <Label className="text-xs text-muted-foreground">Walk na parę</Label>
            <Input type="number" className="w-32" value={count} onChange={e => setCount(Math.max(1, Number(e.target.value) || 0))} />
          </div>
          <div className="flex flex-col gap-1">
            <Label className="text-xs text-muted-foreground">Strategia (wszyscy)</Label>
            <Select value={policy} onValueChange={v => setPolicy(v as PolicyName)}>
              <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
              <SelectContent>
                {(Object.keys(POLICY_LABELS) as PolicyName[]).map(p => <SelectItem key={p} value={p}>{POLICY_LABELS[p]}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={handleRun} disabled={!allLoaded || isLoading || isRunning}>
            {isRunning ? "Liczę…" : "Policz macierz"}
          </Button>
          {isRunning && progress && progress.total > 0 && (
            <span className="text-sm text-muted-foreground">{progress.completed} / {progress.total} par</span>
          )}
          {roster.length < 2 && <span className="text-sm text-muted-foreground">Dodaj co najmniej 2 postacie.</span>}
        </CardContent>
      </Card>

      {matrix && (
        <Card>
          <CardHeader><CardTitle className="text-base">Macierz Win Rate ({matrix.count} walk / para)</CardTitle></CardHeader>
          <CardContent>
            <MatchupHeatmap matrix={matrix} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
