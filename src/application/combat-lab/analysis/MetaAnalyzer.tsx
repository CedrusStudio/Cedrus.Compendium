"use client";

/**
 * Meta Analyzer UI: build a roster, run a round-robin, and read the meta —
 * build ranking (avg win rate), most-used maneuvers, and maneuvers never picked.
 */

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { X } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { CombatantPicker } from "@/application/combat-lab/builder/CombatantPicker";
import { buildSnapshotFromSelection, type CombatantSelection } from "@/application/combat-lab/builder/combatantSelection";
import { useCharactersByIds } from "@/application/combat-lab/hooks/useCharactersByIds";
import { useMeta } from "@/application/combat-lab/hooks/useMeta";
import { computeBalanceHealth } from "@/domain/combat-lab/analysis/balanceHealth";
import { downloadCsv } from "@/application/combat-lab/export/downloadCsv";
import { metaRankingToCsv } from "@/domain/combat-lab/export/toCsv";
import type { PolicySpec } from "@/application/combat-lab/worker/simulationMessages";
import { Button } from "@/common/components/ui/button";
import { Input } from "@/common/components/ui/input";
import { Label } from "@/common/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/common/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/common/components/ui/select";

type PolicyName = "value" | "greedyDamage" | "basicAttack";
const POLICY_LABELS: Record<PolicyName, string> = { value: "Wartościująca", greedyDamage: "Zachłanna", basicAttack: "Podstawowy atak" };

export function MetaAnalyzer()
{
  const [roster, setRoster] = useState<CombatantSelection[]>([]);
  const [draft, setDraft] = useState<CombatantSelection | null>(null);
  const [count, setCount] = useState(300);
  const [policy, setPolicy] = useState<PolicyName>("value");

  const { byId } = useCharactersByIds(useMemo(() => roster.map(r => r.characterId), [roster]));
  const { run, isRunning, progress, report } = useMeta();

  const allLoaded = roster.length >= 2 && roster.every(r => byId.has(r.characterId));

  const addDraft = () =>
  {
    if (!draft) return;
    if (roster.some(r => r.characterId === draft.characterId)) { toast.error("Ta postać jest już w rosterze."); return; }
    setRoster(prev => [...prev, draft]);
    setDraft(null);
  };
  const removeEntry = (id: string) => setRoster(prev => prev.filter(r => r.characterId !== id));

  const handleRun = async () =>
  {
    if (!allLoaded) return;
    const spec: PolicySpec = { name: policy };
    const entries = roster.map(sel => ({ snapshot: buildSnapshotFromSelection(byId.get(sel.characterId)!, sel), policy: spec }));
    try
    {
      await run({ entries, count, seedStart: 0 });
    }
    catch (error)
    {
      toast.error(error instanceof Error ? error.message : "Analiza mety nie powiodła się.");
    }
  };

  const topManeuvers = report?.mostUsedManeuvers.slice(0, 12).map(m => ({ label: m.name, count: m.count })) ?? [];
  const health = useMemo(() => (report ? computeBalanceHealth(report) : null), [report]);

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
                  <button type="button" onClick={() => removeEntry(entry.characterId)} aria-label="Usuń" className="text-muted-foreground hover:text-destructive"><X className="size-3.5" /></button>
                </li>
              ))}
            </ul>
          )}
          <div className="flex flex-wrap items-start gap-3">
            <CombatantPicker title="Dodaj postać" value={draft} onChange={setDraft} />
            <Button variant="outline" disabled={!draft} onClick={addDraft} className="mt-8">Dodaj do rosteru</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Ustawienia</CardTitle></CardHeader>
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
          <Button onClick={handleRun} disabled={!allLoaded || isRunning}>{isRunning ? "Liczę…" : "Analizuj metę"}</Button>
          {isRunning && progress && progress.total > 0 && (
            <span className="text-sm text-muted-foreground">{progress.completed} / {progress.total} par</span>
          )}
          {roster.length < 2 && <span className="text-sm text-muted-foreground">Dodaj co najmniej 2 postacie.</span>}
        </CardContent>
      </Card>

      {report && health && (
        <>
          <Card>
            <CardHeader><CardTitle className="text-base">Zdrowie balansu</CardTitle></CardHeader>
            <CardContent className="flex flex-col gap-3">
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold tabular-nums">{health.score}</span>
                  <span className="text-sm text-muted-foreground">/ 100</span>
                </div>
                <span className={
                  "rounded-full px-3 py-1 text-sm font-medium " +
                  (health.verdict === "zdrowy" ? "bg-emerald-500/15 text-emerald-600"
                    : health.verdict === "umiarkowany" ? "bg-amber-500/15 text-amber-600"
                    : "bg-red-500/15 text-red-600")
                }>{health.verdict}</span>
                <span className="text-sm text-muted-foreground">
                  śr. odchylenie Win Rate od 50%: {(health.dispersion * 100).toFixed(1)} pkt · martwe manewry: {health.deadManeuverCount}
                </span>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <div className="text-xs font-medium text-muted-foreground">Zbyt mocne (Win Rate &gt; 65%)</div>
                  {health.overpowered.length === 0 ? <div className="text-sm text-muted-foreground">brak</div> : (
                    <ul className="text-sm">{health.overpowered.map(r => <li key={r.id} className="text-red-600">{r.name} — {(r.averageWinRate * 100).toFixed(1)}%</li>)}</ul>
                  )}
                </div>
                <div>
                  <div className="text-xs font-medium text-muted-foreground">Zbyt słabe (Win Rate &lt; 35%)</div>
                  {health.underpowered.length === 0 ? <div className="text-sm text-muted-foreground">brak</div> : (
                    <ul className="text-sm">{health.underpowered.map(r => <li key={r.id} className="text-amber-600">{r.name} — {(r.averageWinRate * 100).toFixed(1)}%</li>)}</ul>
                  )}
                </div>
              </div>
              {health.dominantManeuvers.length > 0 && health.dominantManeuvers[0]!.share > 0 && (
                <div className="text-sm text-muted-foreground">
                  Dominujące manewry: {health.dominantManeuvers.map(m => `${m.name} (${(m.share * 100).toFixed(0)}%)`).join(", ")}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Ranking buildów (śr. Win Rate, {report.totalFights} walk)</CardTitle>
              <Button variant="outline" size="sm" onClick={() => downloadCsv("meta-ranking", metaRankingToCsv(report))}>Eksport CSV</Button>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs text-muted-foreground"><th className="p-2">#</th><th className="p-2">Postać</th><th className="p-2 text-right">Śr. Win Rate</th></tr>
                </thead>
                <tbody>
                  {report.ranking.map((entry, i) => (
                    <tr key={entry.id} className="border-b">
                      <td className="p-2 text-muted-foreground">{i + 1}</td>
                      <td className="p-2 font-medium">{entry.name}</td>
                      <td className="p-2 text-right tabular-nums">{(entry.averageWinRate * 100).toFixed(1)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Najczęściej używane manewry</CardTitle></CardHeader>
            <CardContent>
              {topManeuvers.length === 0 ? (
                <p className="text-sm text-muted-foreground">Żaden manewr nie został użyty (puste efekty lub strategia ich nie wybiera).</p>
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={topManeuvers} margin={{ top: 8, right: 8, bottom: 8, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(0 0% 50% / 0.2)" />
                    <XAxis dataKey="label" tick={{ fontSize: 11 }} interval={0} angle={topManeuvers.length > 6 ? -25 : 0} textAnchor={topManeuvers.length > 6 ? "end" : "middle"} height={topManeuvers.length > 6 ? 70 : 30} />
                    <YAxis tick={{ fontSize: 11 }} allowDecimals={false} width={44} />
                    <Tooltip cursor={{ fill: "hsl(0 0% 50% / 0.1)" }} />
                    <Bar dataKey="count" fill="#f59e0b" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Nigdy niewybierane manewry ({report.neverUsedManeuvers.length})</CardTitle></CardHeader>
            <CardContent>
              {report.neverUsedManeuvers.length === 0 ? (
                <p className="text-sm text-muted-foreground">Wszystkie dostępne manewry były używane.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {report.neverUsedManeuvers.map(name => <span key={name} className="rounded border px-2 py-1 text-sm text-muted-foreground">{name}</span>)}
                </div>
              )}
            </CardContent>
          </Card>

          {(report.mostUsedSpells.length > 0 || report.neverUsedSpells.length > 0) && (
            <Card>
              <CardHeader><CardTitle className="text-base">Zaklęcia</CardTitle></CardHeader>
              <CardContent className="flex flex-col gap-3">
                {report.mostUsedSpells.length > 0 && (
                  <div>
                    <div className="mb-1 text-xs font-medium text-muted-foreground">Najczęściej rzucane</div>
                    <div className="flex flex-wrap gap-2">
                      {report.mostUsedSpells.slice(0, 12).map(s => (
                        <span key={s.name} className="rounded border px-2 py-1 text-sm">{s.name} <span className="text-muted-foreground">×{s.count}</span></span>
                      ))}
                    </div>
                  </div>
                )}
                {report.neverUsedSpells.length > 0 && (
                  <div>
                    <div className="mb-1 text-xs font-medium text-muted-foreground">Nigdy nierzucane ({report.neverUsedSpells.length})</div>
                    <div className="flex flex-wrap gap-2">
                      {report.neverUsedSpells.map(name => <span key={name} className="rounded border px-2 py-1 text-sm text-muted-foreground">{name}</span>)}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
