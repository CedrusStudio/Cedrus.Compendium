"use client";

/**
 * End-to-end Combat Lab runner: pick two real characters (+ per-simulation
 * buffs), run N deterministic fights off the main thread, read the summary,
 * save the run, and replay any individual fight — reproduced from the saved
 * configuration (no logs stored).
 */

import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { CombatantPicker } from "@/application/combat-lab/builder/CombatantPicker";
import { buildSnapshotFromSelection, type CombatantSelection } from "@/application/combat-lab/builder/combatantSelection";
import { useCharacterById } from "@/application/combat-lab/hooks/useCharacterById";
import { useSimulation } from "@/application/combat-lab/hooks/useSimulation";
import { CombatReplay } from "@/application/combat-lab/replay/CombatReplay";
import { SimulationSummaryView } from "@/application/combat-lab/runner/SimulationSummaryView";
import { reproduceFight } from "@/domain/combat-lab/persistence/reproduceFight";
import type { SavedSimulationConfiguration } from "@/domain/combat-lab/persistence/SavedSimulation";
import combatLabClient from "@/infrastructure/clients/combatLabClient";
import { Button } from "@/common/components/ui/button";
import { Input } from "@/common/components/ui/input";
import { Label } from "@/common/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/common/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/common/components/ui/select";

/** Only the parameterless policies are offered here (scripted needs a sequence). */
type BasicPolicyName = "value" | "greedyDamage" | "basicAttack";
const POLICIES: BasicPolicyName[] = ["value", "greedyDamage", "basicAttack"];
const POLICY_LABELS: Record<string, string> = {
  value: "Wartościująca (buffy/kontrola/leczenie)",
  greedyDamage: "Zachłanna (max obrażenia)",
  basicAttack: "Podstawowy atak",
};

export function SimulationRunner()
{
  const [selA, setSelA] = useState<CombatantSelection | null>(null);
  const [selB, setSelB] = useState<CombatantSelection | null>(null);
  const [count, setCount] = useState(1000);
  const [policyA, setPolicyA] = useState<BasicPolicyName>("value");
  const [policyB, setPolicyB] = useState<BasicPolicyName>("value");

  const { character: charA } = useCharacterById(selA?.characterId);
  const { character: charB } = useCharacterById(selB?.characterId);

  const { run, isRunning, progress, summary } = useSimulation();
  const queryClient = useQueryClient();
  const [config, setConfig] = useState<SavedSimulationConfiguration | null>(null);
  const [replaySeed, setReplaySeed] = useState(0);
  const [saveName, setSaveName] = useState("");

  const ready = Boolean(charA && charB && selA && selB && count > 0);

  const handleRun = async () =>
  {
    if (!charA || !charB || !selA || !selB) return;

    const configuration: SavedSimulationConfiguration = {
      a: buildSnapshotFromSelection(charA, selA),
      b: buildSnapshotFromSelection(charB, selB),
      count,
      seedStart: 0,
      policyA: { name: policyA },
      policyB: { name: policyB },
    };
    setConfig(configuration);
    setReplaySeed(0);

    try
    {
      await run({
        a: configuration.a,
        b: configuration.b,
        count,
        seedStart: 0,
        policyA: { name: policyA },
        policyB: { name: policyB },
        includeResults: false,
      });
    }
    catch (error)
    {
      toast.error(error instanceof Error ? error.message : "Symulacja nie powiodła się.");
    }
  };

  const handleSave = async () =>
  {
    if (!config || !summary) return;
    const name = saveName.trim() || `${selA?.characterName} vs ${selB?.characterName}`;
    try
    {
      await combatLabClient.saveSimulation(name, config, summary);
      await queryClient.invalidateQueries({ queryKey: ["combat-lab-simulations"] });
      toast.success("Zapisano bieg symulacji.");
    }
    catch (error)
    {
      toast.error(error instanceof Error ? error.message : "Zapis nie powiódł się.");
    }
  };

  const replayLog = useMemo(
    () => (config ? reproduceFight(config, config.seedStart + Math.max(0, Math.min(replaySeed, config.count - 1))) : null),
    [config, replaySeed],
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap gap-4">
        <CombatantPicker title="Combatant A" value={selA} onChange={setSelA} />
        <CombatantPicker title="Combatant B" value={selB} onChange={setSelB} />
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Parametry symulacji</CardTitle></CardHeader>
        <CardContent className="flex flex-wrap items-end gap-4">
          <div className="flex flex-col gap-1">
            <Label className="text-xs text-muted-foreground">Liczba walk</Label>
            <Input type="number" className="w-32" value={count} onChange={e => setCount(Math.max(1, Number(e.target.value) || 0))} />
          </div>
          <PolicySelect label="Strategia A" value={policyA} onChange={setPolicyA} />
          <PolicySelect label="Strategia B" value={policyB} onChange={setPolicyB} />
          <Button onClick={handleRun} disabled={!ready || isRunning}>
            {isRunning ? "Liczę…" : "Uruchom symulację"}
          </Button>
          {isRunning && progress && (
            <span className="text-sm text-muted-foreground">{progress.completed} / {progress.total}</span>
          )}
        </CardContent>
      </Card>

      {summary && config && (
        <>
          <SimulationSummaryView summary={summary} nameA={selA?.characterName ?? "A"} nameB={selB?.characterName ?? "B"} idA={config.a.id} idB={config.b.id} />

          <Card>
            <CardHeader><CardTitle className="text-base">Zapis biegu</CardTitle></CardHeader>
            <CardContent className="flex flex-wrap items-end gap-3">
              <div className="flex flex-col gap-1">
                <Label className="text-xs text-muted-foreground">Nazwa</Label>
                <Input className="w-64" placeholder={`${selA?.characterName} vs ${selB?.characterName}`} value={saveName} onChange={e => setSaveName(e.target.value)} />
              </div>
              <Button variant="outline" onClick={handleSave}>Zapisz bieg</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Podgląd pojedynczej walki</CardTitle></CardHeader>
            <CardContent className="flex flex-col gap-3">
              <div className="flex items-end gap-2">
                <div className="flex flex-col gap-1">
                  <Label className="text-xs text-muted-foreground">Seed (0 – {config.count - 1})</Label>
                  <Input type="number" className="w-32" value={replaySeed} onChange={e => setReplaySeed(Number(e.target.value) || 0)} />
                </div>
              </div>
              {replayLog && <CombatReplay log={replayLog} />}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

function PolicySelect({ label, value, onChange }: { label: string; value: BasicPolicyName; onChange: (v: BasicPolicyName) => void })
{
  return (
    <div className="flex flex-col gap-1">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <Select value={value} onValueChange={(v) => onChange(v as BasicPolicyName)}>
        <SelectTrigger className="w-56"><SelectValue /></SelectTrigger>
        <SelectContent>
          {POLICIES.map(p => <SelectItem key={p} value={p}>{POLICY_LABELS[p]}</SelectItem>)}
        </SelectContent>
      </Select>
    </div>
  );
}

