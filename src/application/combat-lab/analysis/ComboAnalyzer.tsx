"use client";

/**
 * Combo Analyzer UI: run a batch of fights and see the graph of maneuver
 * sequences that actually occurred, plus the most frequent chains.
 */

import { useState } from "react";
import { toast } from "sonner";
import { CombatantPicker } from "@/application/combat-lab/builder/CombatantPicker";
import { buildSnapshotFromSelection, type CombatantSelection } from "@/application/combat-lab/builder/combatantSelection";
import { useCharacterById } from "@/application/combat-lab/hooks/useCharacterById";
import { useCombo } from "@/application/combat-lab/hooks/useCombo";
import { ComboGraphView } from "@/application/combat-lab/analysis/ComboGraphView";
import { topCombos } from "@/domain/combat-lab/analysis/combo";
import type { PolicySpec } from "@/application/combat-lab/worker/simulationMessages";
import { Button } from "@/common/components/ui/button";
import { Input } from "@/common/components/ui/input";
import { Label } from "@/common/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/common/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/common/components/ui/select";

type PolicyName = "value" | "greedyDamage" | "basicAttack";
const POLICY_LABELS: Record<PolicyName, string> = { value: "Wartościująca", greedyDamage: "Zachłanna", basicAttack: "Podstawowy atak" };

export function ComboAnalyzer()
{
  const [selA, setSelA] = useState<CombatantSelection | null>(null);
  const [selB, setSelB] = useState<CombatantSelection | null>(null);
  const [count, setCount] = useState(300);
  const [policyA, setPolicyA] = useState<PolicyName>("value");
  const [policyB, setPolicyB] = useState<PolicyName>("value");

  const { character: charA } = useCharacterById(selA?.characterId);
  const { character: charB } = useCharacterById(selB?.characterId);
  const { run, isRunning, progress, graph } = useCombo();

  const ready = Boolean(charA && charB && selA && selB && count > 0);

  const handleRun = async () =>
  {
    if (!charA || !charB || !selA || !selB) return;
    const specA: PolicySpec = { name: policyA };
    const specB: PolicySpec = { name: policyB };
    try
    {
      await run({
        a: buildSnapshotFromSelection(charA, selA),
        b: buildSnapshotFromSelection(charB, selB),
        count,
        seedStart: 0,
        policyA: specA,
        policyB: specB,
      });
    }
    catch (error)
    {
      toast.error(error instanceof Error ? error.message : "Analiza kombinacji nie powiodła się.");
    }
  };

  const top = graph ? topCombos(graph, 10) : [];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap gap-4">
        <CombatantPicker title="Combatant A" value={selA} onChange={setSelA} />
        <CombatantPicker title="Combatant B" value={selB} onChange={setSelB} />
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Parametry</CardTitle></CardHeader>
        <CardContent className="flex flex-wrap items-end gap-4">
          <div className="flex flex-col gap-1">
            <Label className="text-xs text-muted-foreground">Liczba walk</Label>
            <Input type="number" className="w-32" value={count} onChange={e => setCount(Math.max(1, Number(e.target.value) || 0))} />
          </div>
          <PolicySelect label="Strategia A" value={policyA} onChange={setPolicyA} />
          <PolicySelect label="Strategia B" value={policyB} onChange={setPolicyB} />
          <Button onClick={handleRun} disabled={!ready || isRunning}>{isRunning ? "Liczę…" : "Analizuj kombinacje"}</Button>
          {isRunning && progress && (
            <span className="text-sm text-muted-foreground">{progress.completed} / {progress.total}</span>
          )}
        </CardContent>
      </Card>

      {graph && (
        <>
          <Card>
            <CardHeader><CardTitle className="text-base">Graf sekwencji manewrów ({graph.fights} walk)</CardTitle></CardHeader>
            <CardContent>
              <ComboGraphView graph={graph} />
            </CardContent>
          </Card>

          {top.length > 0 && (
            <Card>
              <CardHeader><CardTitle className="text-base">Najczęstsze kombinacje</CardTitle></CardHeader>
              <CardContent className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-xs text-muted-foreground">
                      <th className="p-2">#</th>
                      <th className="p-2">Kombinacja</th>
                      <th className="p-2 text-right">Wystąpienia</th>
                    </tr>
                  </thead>
                  <tbody>
                    {top.map((edge, i) => (
                      <tr key={edge.id} className="border-b">
                        <td className="p-2 text-muted-foreground">{i + 1}</td>
                        <td className="p-2 font-medium">{edge.from} → {edge.to}</td>
                        <td className="p-2 text-right tabular-nums">{edge.count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}

function PolicySelect({ label, value, onChange }: { label: string; value: PolicyName; onChange: (v: PolicyName) => void })
{
  return (
    <div className="flex flex-col gap-1">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <Select value={value} onValueChange={v => onChange(v as PolicyName)}>
        <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
        <SelectContent>
          {(Object.keys(POLICY_LABELS) as PolicyName[]).map(p => <SelectItem key={p} value={p}>{POLICY_LABELS[p]}</SelectItem>)}
        </SelectContent>
      </Select>
    </div>
  );
}
