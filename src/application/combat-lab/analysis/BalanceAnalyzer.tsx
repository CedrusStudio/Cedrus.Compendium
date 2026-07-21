"use client";

/**
 * Balance Analyzer UI: build a roster, then see each combatant's normalized
 * build profile as a radar (damage/survivability/control/economy/utility/
 * mobility) plus a ranking table. Static + instant — no simulation needed.
 */

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { X } from "lucide-react";
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Legend, Tooltip, ResponsiveContainer } from "recharts";
import { CombatantPicker } from "@/application/combat-lab/builder/CombatantPicker";
import { buildSnapshotFromSelection, type CombatantSelection } from "@/application/combat-lab/builder/combatantSelection";
import { useCharactersByIds } from "@/application/combat-lab/hooks/useCharactersByIds";
import { computeBalanceReport, BALANCE_DIMENSIONS, type BalanceDimension } from "@/domain/combat-lab/analysis/balance";
import { Button } from "@/common/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/common/components/ui/card";

const DIM_LABELS: Record<BalanceDimension, string> = {
  damage: "Obrażenia",
  survivability: "Przeżywalność",
  control: "Kontrola",
  economy: "Ekonomia",
  utility: "Utility",
  mobility: "Mobilność",
};

const COLORS = ["#3b82f6", "#ef4444", "#10b981", "#a855f7", "#f59e0b", "#06b6d4", "#ec4899", "#84cc16"];

export function BalanceAnalyzer()
{
  const [roster, setRoster] = useState<CombatantSelection[]>([]);
  const [draft, setDraft] = useState<CombatantSelection | null>(null);

  const { byId } = useCharactersByIds(useMemo(() => roster.map(r => r.characterId), [roster]));
  const allLoaded = roster.length >= 1 && roster.every(r => byId.has(r.characterId));

  const report = useMemo(() =>
  {
    if (!allLoaded) return null;
    const snapshots = roster.map(sel => buildSnapshotFromSelection(byId.get(sel.characterId)!, sel));
    return computeBalanceReport(snapshots);
  }, [allLoaded, roster, byId]);

  const radarData = useMemo(() =>
  {
    if (!report) return [];
    return BALANCE_DIMENSIONS.map(dim =>
    {
      const row: Record<string, string | number> = { dimension: DIM_LABELS[dim] };
      for (const entry of report.entries) row[entry.name] = Math.round(entry.normalized[dim]);
      return row;
    });
  }, [report]);

  const addDraft = () =>
  {
    if (!draft) return;
    if (roster.some(r => r.characterId === draft.characterId))
    {
      toast.error("Ta postać jest już w rosterze.");
      return;
    }
    setRoster(prev => [...prev, draft]);
    setDraft(null);
  };

  const removeEntry = (characterId: string) => setRoster(prev => prev.filter(r => r.characterId !== characterId));

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
                  <button type="button" onClick={() => removeEntry(entry.characterId)} aria-label="Usuń z rosteru" className="text-muted-foreground hover:text-destructive">
                    <X className="size-3.5" />
                  </button>
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

      {report && report.entries.length > 0 && (
        <>
          <Card>
            <CardHeader><CardTitle className="text-base">Profil buildów (znormalizowany 0–100)</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={380}>
                <RadarChart data={radarData}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="dimension" tick={{ fontSize: 12 }} />
                  <PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                  {report.entries.map((entry, i) => (
                    <Radar key={entry.id} name={entry.name} dataKey={entry.name} stroke={COLORS[i % COLORS.length]} fill={COLORS[i % COLORS.length]} fillOpacity={0.15} />
                  ))}
                  <Legend />
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Ranking</CardTitle></CardHeader>
            <CardContent className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs text-muted-foreground">
                    <th className="p-2">#</th>
                    <th className="p-2">Postać</th>
                    <th className="p-2 text-right">Wynik</th>
                    {BALANCE_DIMENSIONS.map(dim => <th key={dim} className="p-2 text-right">{DIM_LABELS[dim]}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {report.entries.map((entry, i) => (
                    <tr key={entry.id} className="border-b">
                      <td className="p-2 text-muted-foreground">{i + 1}</td>
                      <td className="p-2 font-medium">{entry.name}</td>
                      <td className="p-2 text-right font-semibold tabular-nums">{entry.score.toFixed(0)}</td>
                      {BALANCE_DIMENSIONS.map(dim => <td key={dim} className="p-2 text-right tabular-nums">{entry.normalized[dim].toFixed(0)}</td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
