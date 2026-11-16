"use client";

/**
 * Scenario Builder UI: pick two combatants, choose which scenarios to test, and
 * see how the same matchup plays out under each (win rates side by side).
 */

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { CombatantPicker } from "@/application/combat-lab/builder/CombatantPicker";
import { buildSnapshotFromSelection, type CombatantSelection } from "@/application/combat-lab/builder/combatantSelection";
import { useCharacterById } from "@/application/combat-lab/hooks/useCharacterById";
import { useScenario } from "@/application/combat-lab/hooks/useScenario";
import { SCENARIO_PRESETS } from "@/domain/combat-lab/scenario/scenario";
import { pluginScenarios } from "@/domain/combat-lab/plugins/registry";
import { downloadCsv } from "@/application/combat-lab/export/downloadCsv";
import { scenarioReportToCsv } from "@/domain/combat-lab/export/toCsv";
import type { PolicySpec } from "@/application/combat-lab/worker/simulationMessages";
import { Button } from "@/common/components/ui/button";
import { Input } from "@/common/components/ui/input";
import { Label } from "@/common/components/ui/label";
import { Checkbox } from "@/common/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/common/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/common/components/ui/select";

type PolicyName = "value" | "greedyDamage" | "basicAttack";
const POLICY_LABELS: Record<PolicyName, string> = { value: "Wartościująca", greedyDamage: "Zachłanna", basicAttack: "Podstawowy atak" };

export function ScenarioBuilder()
{
  const [selA, setSelA] = useState<CombatantSelection | null>(null);
  const [selB, setSelB] = useState<CombatantSelection | null>(null);
  const [count, setCount] = useState(400);
  const [policyA, setPolicyA] = useState<PolicyName>("value");
  const [policyB, setPolicyB] = useState<PolicyName>("value");
  const allScenarios = useMemo(() => [...SCENARIO_PRESETS, ...pluginScenarios()], []);
  const [enabled, setEnabled] = useState<Set<string>>(() => new Set(allScenarios.map(s => s.id)));

  const { character: charA } = useCharacterById(selA?.characterId);
  const { character: charB } = useCharacterById(selB?.characterId);
  const { run, isRunning, progress, report } = useScenario();

  const scenarios = useMemo(() => allScenarios.filter(s => enabled.has(s.id)), [allScenarios, enabled]);
  const ready = Boolean(charA && charB && selA && selB && count > 0 && scenarios.length > 0);

  const toggle = (id: string, on: boolean) => setEnabled(prev => {
    const next = new Set(prev);
    if (on) next.add(id); else next.delete(id);
    return next;
  });

  const handleRun = async () =>
  {
    if (!charA || !charB || !selA || !selB) return;
    try
    {
      await run({
        a: buildSnapshotFromSelection(charA, selA),
        b: buildSnapshotFromSelection(charB, selB),
        scenarios,
        count,
        seedStart: 0,
        policyA: { name: policyA } satisfies PolicySpec,
        policyB: { name: policyB } satisfies PolicySpec,
      });
    }
    catch (error)
    {
      toast.error(error instanceof Error ? error.message : "Analiza scenariuszy nie powiodła się.");
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap gap-4">
        <CombatantPicker title="Combatant A" value={selA} onChange={setSelA} />
        <CombatantPicker title="Combatant B" value={selB} onChange={setSelB} />
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Scenariusze</CardTitle></CardHeader>
        <CardContent className="flex flex-col gap-2">
          {allScenarios.map(scenario => (
            <label key={scenario.id} className="flex items-start gap-2 text-sm">
              <Checkbox checked={enabled.has(scenario.id)} onCheckedChange={c => toggle(scenario.id, c === true)} className="mt-0.5" />
              <span>
                <span className="font-medium">{scenario.name}</span>
                <span className="text-muted-foreground"> — {scenario.description}</span>
              </span>
            </label>
          ))}
          <p className="mt-1 text-xs text-muted-foreground">Walka grupowa / oblężenie tłumu (NvN) wymaga silnika wielopostaciowego — obecnie 1v1, więc „Oblężenie&quot; jest przybliżone parametrami.</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Ustawienia</CardTitle></CardHeader>
        <CardContent className="flex flex-wrap items-end gap-4">
          <div className="flex flex-col gap-1">
            <Label className="text-xs text-muted-foreground">Walk na scenariusz</Label>
            <Input type="number" className="w-32" value={count} onChange={e => setCount(Math.max(1, Number(e.target.value) || 0))} />
          </div>
          <PolicySelect label="Strategia A" value={policyA} onChange={setPolicyA} />
          <PolicySelect label="Strategia B" value={policyB} onChange={setPolicyB} />
          <Button onClick={handleRun} disabled={!ready || isRunning}>{isRunning ? "Liczę…" : "Porównaj scenariusze"}</Button>
          {isRunning && progress && progress.total > 0 && (
            <span className="text-sm text-muted-foreground">{progress.completed} / {progress.total}</span>
          )}
        </CardContent>
      </Card>

      {report && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">{report.aName} vs {report.bName} ({report.count} walk / scenariusz)</CardTitle>
            <Button variant="outline" size="sm" onClick={() => downloadCsv("scenariusze", scenarioReportToCsv(report))}>Eksport CSV</Button>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs text-muted-foreground">
                  <th className="p-2">Scenariusz</th>
                  <th className="p-2 text-right">Win Rate {report.aName}</th>
                  <th className="p-2 text-right">Win Rate {report.bName}</th>
                  <th className="p-2 text-right">Remisy</th>
                  <th className="p-2 text-right">Śr. rundy</th>
                </tr>
              </thead>
              <tbody>
                {report.rows.map(row => (
                  <tr key={row.scenarioId} className="border-b">
                    <td className="p-2 font-medium">{row.scenarioName}</td>
                    <td className="p-2 text-right tabular-nums">{(row.winRateA * 100).toFixed(1)}%</td>
                    <td className="p-2 text-right tabular-nums">{(row.winRateB * 100).toFixed(1)}%</td>
                    <td className="p-2 text-right tabular-nums">{row.draws}</td>
                    <td className="p-2 text-right tabular-nums">{row.averageRounds.toFixed(1)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
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
