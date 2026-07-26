"use client";

/**
 * Rules Validator UI: pick combatants and see static issues in their maneuvers
 * (dead mechanics, broken buff references, zero-duration effects, duplicates…).
 * Instant — no simulation.
 */

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { X, AlertCircle, AlertTriangle, Info, CheckCircle2 } from "lucide-react";
import { CombatantPicker } from "@/application/combat-lab/builder/CombatantPicker";
import { buildSnapshotFromSelection, type CombatantSelection } from "@/application/combat-lab/builder/combatantSelection";
import { useCharactersByIds } from "@/application/combat-lab/hooks/useCharactersByIds";
import { validateManeuvers, countBySeverity, type ValidationIssue, type IssueSeverity } from "@/domain/combat-lab/validation/rulesValidator";
import { Button } from "@/common/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/common/components/ui/card";

type CombatantReport = { id: string; name: string; issues: ValidationIssue[] };

export function RulesValidatorPanel()
{
  const [roster, setRoster] = useState<CombatantSelection[]>([]);
  const [draft, setDraft] = useState<CombatantSelection | null>(null);

  const { byId } = useCharactersByIds(useMemo(() => roster.map(r => r.characterId), [roster]));

  const reports = useMemo<CombatantReport[]>(() =>
  {
    return roster
      .filter(sel => byId.has(sel.characterId))
      .map(sel =>
      {
        const snapshot = buildSnapshotFromSelection(byId.get(sel.characterId)!, sel);
        const buffProfileIds = new Set(snapshot.buffProfiles.map(p => p.id));
        return { id: sel.characterId, name: sel.characterName, issues: validateManeuvers(snapshot.maneuvers, { buffProfileIds }) };
      });
  }, [roster, byId]);

  const totals = useMemo(() => countBySeverity(reports.flatMap(r => r.issues)), [reports]);

  const addDraft = () =>
  {
    if (!draft) return;
    if (roster.some(r => r.characterId === draft.characterId)) { toast.error("Ta postać jest już na liście."); return; }
    setRoster(prev => [...prev, draft]);
    setDraft(null);
  };
  const removeEntry = (id: string) => setRoster(prev => prev.filter(r => r.characterId !== id));

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader><CardTitle className="text-base">Postacie do sprawdzenia ({roster.length})</CardTitle></CardHeader>
        <CardContent className="flex flex-col gap-3">
          {roster.length > 0 && (
            <ul className="flex flex-wrap gap-2">
              {roster.map(entry => (
                <li key={entry.characterId} className="flex items-center gap-1 rounded border px-2 py-1 text-sm">
                  <span>{entry.characterName}</span>
                  <button type="button" onClick={() => removeEntry(entry.characterId)} aria-label="Usuń" className="text-muted-foreground hover:text-destructive">
                    <X className="size-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          )}
          <div className="flex flex-wrap items-start gap-3">
            <CombatantPicker title="Dodaj postać" value={draft} onChange={setDraft} />
            <Button variant="outline" disabled={!draft} onClick={addDraft} className="mt-8">Dodaj</Button>
          </div>
        </CardContent>
      </Card>

      {reports.length > 0 && (
        <>
          <div className="flex flex-wrap gap-3 text-sm">
            <SeverityTotal severity="error" count={totals.error} />
            <SeverityTotal severity="warning" count={totals.warning} />
            <SeverityTotal severity="info" count={totals.info} />
          </div>

          {reports.map(report => (
            <Card key={report.id}>
              <CardHeader><CardTitle className="text-base">{report.name}</CardTitle></CardHeader>
              <CardContent>
                {report.issues.length === 0 ? (
                  <p className="flex items-center gap-2 text-sm text-emerald-600">
                    <CheckCircle2 className="size-4" /> Brak problemów.
                  </p>
                ) : (
                  <ul className="flex flex-col gap-2">
                    {report.issues.map((issue, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <SeverityIcon severity={issue.severity} />
                        <span>
                          {issue.maneuverName && <span className="font-medium">{issue.maneuverName}: </span>}
                          {issue.message}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          ))}
        </>
      )}
    </div>
  );
}

function SeverityIcon({ severity }: { severity: IssueSeverity })
{
  if (severity === "error") return <AlertCircle className="mt-0.5 size-4 shrink-0 text-destructive" />;
  if (severity === "warning") return <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-500" />;
  return <Info className="mt-0.5 size-4 shrink-0 text-blue-500" />;
}

function SeverityTotal({ severity, count }: { severity: IssueSeverity; count: number })
{
  const label = severity === "error" ? "Błędy" : severity === "warning" ? "Ostrzeżenia" : "Info";
  return (
    <span className="flex items-center gap-1 rounded border px-2 py-1">
      <SeverityIcon severity={severity} /> {label}: <span className="font-semibold tabular-nums">{count}</span>
    </span>
  );
}
