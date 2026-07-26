"use client";

/**
 * Synergy Analyzer UI: pick a subject build + an opponent, run the ablation in a
 * worker, and see each maneuver's contribution to the subject's win rate
 * (baseline − without). Positive = pulling its weight; near zero / negative =
 * candidate to cut.
 */

import { useState } from "react";
import { toast } from "sonner";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine } from "recharts";
import { CombatantPicker } from "@/application/combat-lab/builder/CombatantPicker";
import { buildSnapshotFromSelection, type CombatantSelection } from "@/application/combat-lab/builder/combatantSelection";
import { useCharacterById } from "@/application/combat-lab/hooks/useCharacterById";
import { useSynergy } from "@/application/combat-lab/hooks/useSynergy";
import type { PolicySpec } from "@/application/combat-lab/worker/simulationMessages";
import { Button } from "@/common/components/ui/button";
import { Input } from "@/common/components/ui/input";
import { Label } from "@/common/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/common/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/common/components/ui/select";

type PolicyName = "value" | "greedyDamage" | "basicAttack";
const POLICY_LABELS: Record<PolicyName, string> = { value: "Wartościująca", greedyDamage: "Zachłanna", basicAttack: "Podstawowy atak" };

export function SynergyAnalyzer()
{
  const [subjectSel, setSubjectSel] = useState<CombatantSelection | null>(null);
  const [opponentSel, setOpponentSel] = useState<CombatantSelection | null>(null);
  const [count, setCount] = useState(500);
  const [subjectPolicy, setSubjectPolicy] = useState<PolicyName>("value");
  const [opponentPolicy, setOpponentPolicy] = useState<PolicyName>("value");

  const { character: subjectChar } = useCharacterById(subjectSel?.characterId);
  const { character: opponentChar } = useCharacterById(opponentSel?.characterId);
  const { run, isRunning, progress, report } = useSynergy();

  const ready = Boolean(subjectChar && opponentChar && subjectSel && opponentSel && count > 0);

  const handleRun = async () =>
  {
    if (!subjectChar || !opponentChar || !subjectSel || !opponentSel) return;
    const subjectSpec: PolicySpec = { name: subjectPolicy };
    const opponentSpec: PolicySpec = { name: opponentPolicy };
    try
    {
      await run({
        subject: buildSnapshotFromSelection(subjectChar, subjectSel),
        opponent: buildSnapshotFromSelection(opponentChar, opponentSel),
        count,
        seedStart: 0,
        subjectPolicy: subjectSpec,
        opponentPolicy: opponentSpec,
      });
    }
    catch (error)
    {
      toast.error(error instanceof Error ? error.message : "Analiza synergii nie powiodła się.");
    }
  };

  const chartData = report?.elements.map(e => ({ label: e.name, pp: Math.round(e.contribution * 1000) / 10 })) ?? [];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap gap-4">
        <CombatantPicker title="Badana postać" value={subjectSel} onChange={setSubjectSel} />
        <CombatantPicker title="Przeciwnik" value={opponentSel} onChange={setOpponentSel} />
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Parametry</CardTitle></CardHeader>
        <CardContent className="flex flex-wrap items-end gap-4">
          <div className="flex flex-col gap-1">
            <Label className="text-xs text-muted-foreground">Walk na wariant</Label>
            <Input type="number" className="w-32" value={count} onChange={e => setCount(Math.max(1, Number(e.target.value) || 0))} />
          </div>
          <PolicySelect label="Strategia badanej" value={subjectPolicy} onChange={setSubjectPolicy} />
          <PolicySelect label="Strategia przeciwnika" value={opponentPolicy} onChange={setOpponentPolicy} />
          <Button onClick={handleRun} disabled={!ready || isRunning}>{isRunning ? "Liczę…" : "Analizuj synergię"}</Button>
          {isRunning && progress && progress.total > 0 && (
            <span className="text-sm text-muted-foreground">{progress.completed} / {progress.total}</span>
          )}
        </CardContent>
      </Card>

      {report && (
        <>
          <Card>
            <CardHeader><CardTitle className="text-base">Wkład manewrów w Win Rate (pkt proc.)</CardTitle></CardHeader>
            <CardContent>
              <p className="mb-2 text-sm text-muted-foreground">Bazowy Win Rate: {(report.baselineWinRate * 100).toFixed(1)}% ({report.count} walk / wariant)</p>
              {chartData.length === 0 ? (
                <p className="text-sm text-muted-foreground">Badana postać nie ma manewrów do analizy.</p>
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={chartData} margin={{ top: 8, right: 8, bottom: 8, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(0 0% 50% / 0.2)" />
                    <XAxis dataKey="label" tick={{ fontSize: 11 }} interval={0} angle={chartData.length > 6 ? -25 : 0} textAnchor={chartData.length > 6 ? "end" : "middle"} height={chartData.length > 6 ? 60 : 30} />
                    <YAxis tick={{ fontSize: 11 }} width={40} unit=" pp" />
                    <ReferenceLine y={0} stroke="hsl(0 0% 50% / 0.5)" />
                    <Tooltip cursor={{ fill: "hsl(0 0% 50% / 0.1)" }} />
                    <Bar dataKey="pp" fill="#10b981" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {report.elements.length > 0 && (
            <Card>
              <CardHeader><CardTitle className="text-base">Szczegóły</CardTitle></CardHeader>
              <CardContent className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-xs text-muted-foreground">
                      <th className="p-2">Manewr</th>
                      <th className="p-2 text-right">Wkład (pp)</th>
                      <th className="p-2 text-right">Win Rate bez niego</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.elements.map(e => (
                      <tr key={e.id} className="border-b">
                        <td className="p-2 font-medium">{e.name}</td>
                        <td className="p-2 text-right tabular-nums">{(e.contribution * 100).toFixed(1)}</td>
                        <td className="p-2 text-right tabular-nums">{(e.withoutWinRate * 100).toFixed(1)}%</td>
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
