"use client";

/**
 * Parameter Tuning UI: nudge global parameters (damage, dice, crit, defense, hp)
 * and instantly see how the subject's Win Rate / fight length / winner hp shift
 * against a fixed opponent (baseline vs tuned). Recomputes automatically
 * (debounced) as you tweak.
 */

import { useCallback, useEffect, useState } from "react";
import { useDebounce } from "use-debounce";
import { toast } from "sonner";
import { CombatantPicker } from "@/application/combat-lab/builder/CombatantPicker";
import { buildSnapshotFromSelection, type CombatantSelection } from "@/application/combat-lab/builder/combatantSelection";
import { useCharacterById } from "@/application/combat-lab/hooks/useCharacterById";
import { useTuning } from "@/application/combat-lab/hooks/useTuning";
import { NO_OVERRIDES, type ParameterOverrides } from "@/domain/combat-lab/tuning/parameters";
import type { PolicySpec } from "@/application/combat-lab/worker/simulationMessages";
import type { TuningStats } from "@/domain/combat-lab/tuning/parameters";
import { Input } from "@/common/components/ui/input";
import { Label } from "@/common/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/common/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/common/components/ui/select";
import { Button } from "@/common/components/ui/button";

type PolicyName = "value" | "greedyDamage" | "basicAttack";
const POLICY_LABELS: Record<PolicyName, string> = { value: "Wartościująca", greedyDamage: "Zachłanna", basicAttack: "Podstawowy atak" };

const OFFENSE_FIELDS: { key: keyof ParameterOverrides; label: string }[] = [
  { key: "damageBonus", label: "Bonus obrażeń" },
  { key: "diceGrade", label: "Ranga kości" },
  { key: "critPower", label: "Siła krytyka" },
  { key: "critRange", label: "Szansa krytyka" },
];
const DEFENSE_FIELDS: { key: keyof ParameterOverrides; label: string }[] = [
  { key: "block", label: "Blokowanie" },
  { key: "parry", label: "Parowanie" },
  { key: "dodge", label: "Unik" },
  { key: "protection", label: "Pancerz" },
  { key: "resistance", label: "Odporność" },
  { key: "hp", label: "HP" },
];

export function ParameterTuning()
{
  const [subjectSel, setSubjectSel] = useState<CombatantSelection | null>(null);
  const [opponentSel, setOpponentSel] = useState<CombatantSelection | null>(null);
  const [count, setCount] = useState(400);
  const [subjectPolicy, setSubjectPolicy] = useState<PolicyName>("value");
  const [opponentPolicy, setOpponentPolicy] = useState<PolicyName>("value");
  const [overrides, setOverrides] = useState<ParameterOverrides>(NO_OVERRIDES);

  const { character: subjectChar } = useCharacterById(subjectSel?.characterId);
  const { character: opponentChar } = useCharacterById(opponentSel?.characterId);
  const { run, isRunning, result } = useTuning();

  const [debouncedOverrides] = useDebounce(overrides, 400);
  const [debouncedCount] = useDebounce(count, 400);

  const ready = Boolean(subjectChar && opponentChar && subjectSel && opponentSel && count > 0);

  const runTuning = useCallback(async () =>
  {
    if (!subjectChar || !opponentChar || !subjectSel || !opponentSel) return;
    try
    {
      await run({
        subject: buildSnapshotFromSelection(subjectChar, subjectSel),
        opponent: buildSnapshotFromSelection(opponentChar, opponentSel),
        overrides: debouncedOverrides,
        count: debouncedCount,
        seedStart: 0,
        subjectPolicy: { name: subjectPolicy } satisfies PolicySpec,
        opponentPolicy: { name: opponentPolicy } satisfies PolicySpec,
      });
    }
    catch (error)
    {
      toast.error(error instanceof Error ? error.message : "Przeliczenie nie powiodło się.");
    }
  }, [subjectChar, opponentChar, subjectSel, opponentSel, debouncedOverrides, debouncedCount, subjectPolicy, opponentPolicy, run]);

  useEffect(() =>
  {
    if (ready) void runTuning();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedOverrides, debouncedCount, subjectPolicy, opponentPolicy, subjectSel?.characterId, opponentSel?.characterId, subjectChar, opponentChar]);

  const setField = (key: keyof ParameterOverrides, value: number) => setOverrides(prev => ({ ...prev, [key]: value }));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap gap-4">
        <CombatantPicker title="Strojona postać" value={subjectSel} onChange={setSubjectSel} />
        <CombatantPicker title="Przeciwnik" value={opponentSel} onChange={setOpponentSel} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">Parametry ofensywne (Δ)</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-2 gap-3">
            {OFFENSE_FIELDS.map(f => <NumberField key={f.key} label={f.label} value={overrides[f.key]} onChange={v => setField(f.key, v)} />)}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Parametry defensywne (Δ)</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-2 gap-3">
            {DEFENSE_FIELDS.map(f => <NumberField key={f.key} label={f.label} value={overrides[f.key]} onChange={v => setField(f.key, v)} />)}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Ustawienia</CardTitle></CardHeader>
        <CardContent className="flex flex-wrap items-end gap-4">
          <div className="flex flex-col gap-1">
            <Label className="text-xs text-muted-foreground">Walk na wariant</Label>
            <Input type="number" className="w-32" value={count} onChange={e => setCount(Math.max(1, Number(e.target.value) || 0))} />
          </div>
          <PolicySelect label="Strategia strojonej" value={subjectPolicy} onChange={setSubjectPolicy} />
          <PolicySelect label="Strategia przeciwnika" value={opponentPolicy} onChange={setOpponentPolicy} />
          <Button variant="outline" onClick={() => setOverrides(NO_OVERRIDES)}>Wyzeruj Δ</Button>
          {isRunning && <span className="text-sm text-muted-foreground">Liczę…</span>}
        </CardContent>
      </Card>

      {result && (
        <Card>
          <CardHeader><CardTitle className="text-base">Wpływ ({result.count} walk / wariant)</CardTitle></CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="rounded border p-4 text-center">
              <div className="text-xs text-muted-foreground">Zmiana Win Rate</div>
              <div className={`text-3xl font-bold tabular-nums ${result.winRateDelta >= 0 ? "text-emerald-600" : "text-destructive"}`}>
                {result.winRateDelta >= 0 ? "+" : ""}{(result.winRateDelta * 100).toFixed(1)} pp
              </div>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs text-muted-foreground">
                  <th className="p-2">Metryka</th>
                  <th className="p-2 text-right">Baseline</th>
                  <th className="p-2 text-right">Strojone</th>
                </tr>
              </thead>
              <tbody>
                <Row label="Win Rate" fmt={v => `${(v * 100).toFixed(1)}%`} pick={s => s.winRate} baseline={result.baseline} tuned={result.tuned} />
                <Row label="Śr. liczba rund" fmt={v => v.toFixed(1)} pick={s => s.averageRounds} baseline={result.baseline} tuned={result.tuned} />
                <Row label="Śr. HP zwycięzcy" fmt={v => v.toFixed(1)} pick={s => s.averageWinnerHp} baseline={result.baseline} tuned={result.tuned} />
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function Row({ label, fmt, pick, baseline, tuned }: { label: string; fmt: (v: number) => string; pick: (s: TuningStats) => number; baseline: TuningStats; tuned: TuningStats })
{
  return (
    <tr className="border-b">
      <td className="p-2 font-medium">{label}</td>
      <td className="p-2 text-right tabular-nums">{fmt(pick(baseline))}</td>
      <td className="p-2 text-right tabular-nums">{fmt(pick(tuned))}</td>
    </tr>
  );
}

function NumberField({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void })
{
  return (
    <div className="flex flex-col gap-1">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <Input type="number" value={value} onChange={e => onChange(Number(e.target.value) || 0)} />
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
