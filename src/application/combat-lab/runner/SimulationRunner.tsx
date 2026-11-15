"use client";

/**
 * End-to-end Combat Lab runner: pick two real characters (+ per-simulation
 * buffs), run N deterministic fights off the main thread, read the summary,
 * save the run, and replay any individual fight — reproduced from the saved
 * configuration (no logs stored).
 */

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { displayedText } from "@/common/translations";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { CombatantPicker } from "@/application/combat-lab/builder/CombatantPicker";
import { CombatantStatsCard } from "@/application/combat-lab/builder/CombatantStatsCard";
import { buildSnapshotFromSelection, type CombatantSelection } from "@/application/combat-lab/builder/combatantSelection";
import { useCharacterById } from "@/application/combat-lab/hooks/useCharacterById";
import { usePowerSpecifications } from "@/application/combat-lab/hooks/usePowerSpecifications";
import type { PowerSpecification } from "@/domain/characters/combat/Power";
import { type SimulationOutcome, useSimulation } from "@/application/combat-lab/hooks/useSimulation";
import { CombatReplay } from "@/application/combat-lab/replay/CombatReplay";
import { SimulationSummaryView } from "@/application/combat-lab/runner/SimulationSummaryView";
import { StatisticsDashboard } from "@/application/combat-lab/analysis/StatisticsDashboard";
import { downloadCsv } from "@/application/combat-lab/export/downloadCsv";
import { rawResultsToCsv } from "@/domain/combat-lab/export/toCsv";
import { reproduceFight } from "@/domain/combat-lab/persistence/reproduceFight";
import type { SavedSimulationConfiguration } from "@/domain/combat-lab/persistence/SavedSimulation";
import type { PolicySpec } from "@/application/combat-lab/worker/simulationMessages";
import { pluginPolicies } from "@/domain/combat-lab/plugins/registry";
import combatLabClient from "@/infrastructure/clients/combatLabClient";
import { Button } from "@/common/components/ui/button";
import { Input } from "@/common/components/ui/input";
import { Label } from "@/common/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/common/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/common/components/ui/select";
import { Checkbox } from "@/common/components/ui/checkbox";

// Built-in policies plus any registered by plugins (resolved by name).
type PolicyName = string;
const BUILTIN_POLICY_LABELS: Record<string, string> = {
  value: "Wartościująca (buffy/kontrola/leczenie)",
  greedyDamage: "Zachłanna (max obrażenia)",
  basicAttack: "Podstawowy atak",
  scripted: "Skryptowana (sekwencja manewrów)",
};

function policyOptions(): { name: string; label: string }[]
{
  const builtin = Object.entries(BUILTIN_POLICY_LABELS).map(([name, label]) => ({ name, label }));
  const plugins = pluginPolicies().map(p => ({ name: p.name, label: p.label }));
  return [...builtin, ...plugins];
}

function parseSequence(text: string): string[]
{
  return text.split(",").map(s => s.trim()).filter(Boolean);
}

function buildPolicySpec(name: PolicyName, script: string): PolicySpec
{
  return name === "scripted" ? { name: "scripted", sequence: parseSequence(script) } : { name };
}

type RunInput = {
  configuration: SavedSimulationConfiguration;
  nameA: string;
  nameB: string;
  includeResults: boolean;
};
type CompletedRun = { id: number; input: RunInput; signature: string; outcome: SimulationOutcome };

export function SimulationRunner()
{
  const [selA, setSelA] = useState<CombatantSelection | null>(null);
  const [selB, setSelB] = useState<CombatantSelection | null>(null);
  const [count, setCount] = useState(1000);
  const [policyA, setPolicyA] = useState<PolicyName>("value");
  const [policyB, setPolicyB] = useState<PolicyName>("value");
  const [scriptA, setScriptA] = useState("");
  const [scriptB, setScriptB] = useState("");

  const { character: charA } = useCharacterById(selA?.characterId);
  const { character: charB } = useCharacterById(selB?.characterId);

  // Load the PowerSpecifications each character references so castable spells
  // resolve into damage offenses (magic-as-attacks).
  const { specifications: specsA } = usePowerSpecifications(charA);
  const { specifications: specsB } = usePowerSpecifications(charB);

  const selWithSpecs = (sel: CombatantSelection | null, specs: Record<string, PowerSpecification>): CombatantSelection | null =>
    sel ? { ...sel, powerSpecifications: specs } : null;

  const { run, cancel, isRunning, progress, status, error } = useSimulation();
  const queryClient = useQueryClient();
  const [completed, setCompleted] = useState<CompletedRun | null>(null);
  const generation = useRef(0);
  const mounted = useRef(true);
  const saving = useRef(false);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "failed">("idle");
  const [preparationError, setPreparationError] = useState<string | null>(null);
  const fieldId = useId();
  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; generation.current++; };
  }, []);
  const [replaySeed, setReplaySeed] = useState(0);
  const [saveName, setSaveName] = useState("");
  const [collectStats, setCollectStats] = useState(true);

  const validCount = Number.isSafeInteger(count) && count > 0;

  const previewA = useMemo(() => (charA && selA ? buildSnapshotFromSelection(charA, selWithSpecs(selA, specsA)!) : null), [charA, selA, specsA]);
  const previewB = useMemo(() => (charB && selB ? buildSnapshotFromSelection(charB, selWithSpecs(selB, specsB)!) : null), [charB, selB, specsB]);

  const input: RunInput | null = previewA && previewB && selA && selB ? {
    configuration: {
      a: previewA, b: previewB, count, seedStart: 0,
      policyA: buildPolicySpec(policyA, scriptA), policyB: buildPolicySpec(policyB, scriptB),
    },
    nameA: selA.characterName, nameB: selB.characterName, includeResults: collectStats,
  } : null;
  const ready = Boolean(input && validCount && charA?.id === selA?.characterId && charB?.id === selB?.characterId);
  const config = completed?.input.configuration;
  const summary = completed?.outcome.summary;
  const results = completed?.outcome.results;
  const changedSettings = completed && JSON.stringify(input) !== completed.signature;
  const isSaving = saveState === "saving";

  const handleRun = async () => {
    if (!ready || !input || isRunning || saving.current) return;
    const id = ++generation.current;
    setCompleted(null);
    setSaveState("idle");
    setSaveName("");
    setPreparationError(null);
    setReplaySeed(0);
    try {
      const frozen = structuredClone(input);
      const outcome = await run({ ...frozen.configuration, includeResults: frozen.includeResults });
      if (mounted.current && generation.current === id) {
        setCompleted({ id, input: frozen, signature: JSON.stringify(frozen), outcome });
      }
    } catch (failure) {
      if (failure && typeof failure === "object" && "name" in failure && failure.name === "AbortError") return;
      if (mounted.current && generation.current === id) {
        setPreparationError(failure instanceof Error ? failure.message : displayedText.simulationFailed);
      }
    }
  };

  const handleSave = async () => {
    if (!completed || saving.current || saveState === "saved") return;
    saving.current = true;
    setSaveState("saving");
    const captured = completed;
    const name = saveName.trim() || `${captured.input.nameA} vs ${captured.input.nameB}`;
    try {
      await combatLabClient.saveSimulation(name, captured.input.configuration, captured.outcome.summary);
      if (mounted.current) {
        setSaveState("saved");
        toast.success(displayedText.simulationSaved);
      }
      // A cache refresh failure must not invite a duplicate save after a successful write.
      void queryClient.invalidateQueries({ queryKey: ["combat-lab-simulations"] }).catch(() => {});
    } catch {
      if (mounted.current) setSaveState("failed");
    } finally {
      saving.current = false;
    }
  };

  const validReplaySeed = Boolean(config && Number.isSafeInteger(replaySeed) && replaySeed >= 0 && replaySeed < config.count);
  const replayLog = useMemo(
    () => (config && validReplaySeed ? reproduceFight(config, config.seedStart + replaySeed) : null),
    [config, replaySeed, validReplaySeed],
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap gap-4">
        <CombatantPicker title={displayedText.simulationParticipantA} value={selA} onChange={setSelA} />
        <CombatantPicker title={displayedText.simulationParticipantB} value={selB} onChange={setSelB} />
      </div>

      {(previewA || previewB) && (
        <div className="flex flex-wrap gap-4">
          {previewA && <CombatantStatsCard title="Statystyki A" snapshot={previewA} />}
          {previewB && <CombatantStatsCard title="Statystyki B" snapshot={previewB} />}
        </div>
      )}

      <Card>
        <CardHeader><CardTitle className="text-base">Parametry symulacji</CardTitle></CardHeader>
        <CardContent className="flex flex-wrap items-end gap-4">
          <div className="flex flex-col gap-1">
            <Label htmlFor={`${fieldId}-count`} className="text-xs text-muted-foreground">{displayedText.simulationCount}</Label>
            <Input id={`${fieldId}-count`} type="number" min={1} step={1} aria-invalid={!validCount} className="w-32" value={count} onChange={e => setCount(Number(e.target.value))} />
          </div>
          <PolicyPicker label="Strategia A" name={policyA} onNameChange={setPolicyA} script={scriptA} onScriptChange={setScriptA} />
          <PolicyPicker label="Strategia B" name={policyB} onNameChange={setPolicyB} script={scriptB} onScriptChange={setScriptB} />
          <label className="mb-1 flex items-center gap-2 text-sm">
            <Checkbox checked={collectStats} onCheckedChange={(c) => setCollectStats(c === true)} />
            Zbieraj statystyki
          </label>
          <Button onClick={handleRun} disabled={!ready || isRunning || isSaving}>
            {isRunning ? displayedText.simulationRunning : displayedText.simulationStart}
          </Button>
          {isRunning && <Button variant="outline" onClick={cancel}>{displayedText.simulationCancel}</Button>}
          {isRunning && progress && <div className="flex items-center gap-2">
            <progress aria-label={displayedText.simulationProgress} value={progress.completed} max={progress.total} className="w-32" />
            <span className="text-sm text-muted-foreground">{progress.completed} / {progress.total}</span>
          </div>}
        </CardContent>
      </Card>

      {!input && <p role="status" className="text-sm text-muted-foreground">{displayedText.simulationPickBoth}</p>}
      {!validCount && <p role="alert">{displayedText.simulationInvalidCount}</p>}
      {isRunning && <p className="text-sm text-muted-foreground">{displayedText.simulationLeaveNotice}</p>}
      {status === "cancelled" && <p role="status">{displayedText.simulationCancelled}</p>}
      {(error || preparationError) && <div role="alert" className="space-y-2">
        <p>{displayedText.simulationFailed} {error || preparationError}</p>
        <Button variant="outline" onClick={handleRun} disabled={!ready || isRunning || isSaving}>{displayedText.simulationRetry}</Button>
      </div>}

      {summary && config && completed && (
        <section aria-label={displayedText.simulationCompleted} className="flex flex-col gap-6">
          {changedSettings && <p role="status" className="text-sm text-muted-foreground">{displayedText.simulationSettingsChanged}</p>}
          <SimulationSummaryView summary={summary} nameA={completed.input.nameA} nameB={completed.input.nameB} idA={config.a.id} idB={config.b.id} />

          {results && results.length > 0 && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base">Statystyki</CardTitle>
                <Button variant="outline" size="sm" onClick={() => downloadCsv("wyniki-symulacji", rawResultsToCsv(results))}>Eksport CSV (wyniki)</Button>
              </CardHeader>
              <CardContent>
                <StatisticsDashboard results={results} />
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader><CardTitle className="text-base">Zapis biegu</CardTitle></CardHeader>
            <CardContent className="flex flex-wrap items-end gap-3">
              <div className="flex flex-col gap-1">
                <Label htmlFor={`${fieldId}-save-name`} className="text-xs text-muted-foreground">{displayedText.simulationName}</Label>
                <Input id={`${fieldId}-save-name`} className="w-64" disabled={isSaving || saveState === "saved"} placeholder={`${completed.input.nameA} vs ${completed.input.nameB}`} value={saveName} onChange={e => setSaveName(e.target.value)} />
              </div>
              <Button variant="outline" onClick={handleSave} disabled={isSaving || saveState === "saved"}>
                {isSaving ? displayedText.simulationSaving : displayedText.simulationSave}
              </Button>
            </CardContent>
          </Card>

          {saveState === "saved" && <p role="status">{displayedText.simulationSaved}</p>}
          {saveState === "failed" && <p role="alert">{displayedText.simulationSaveFailed}</p>}

          <Card>
            <CardHeader><CardTitle className="text-base">Podgląd pojedynczej walki</CardTitle></CardHeader>
            <CardContent className="flex flex-col gap-3">
              <div className="flex items-end gap-2">
                <div className="flex flex-col gap-1">
                  <Label htmlFor={`${fieldId}-seed`} className="text-xs text-muted-foreground">{displayedText.simulationSeed} (0 - {config.count - 1})</Label>
                  <Input id={`${fieldId}-seed`} type="number" min={0} max={config.count - 1} step={1} aria-invalid={!validReplaySeed} className="w-32" value={replaySeed} onChange={e => setReplaySeed(Number(e.target.value) || 0)} />
                </div>
              </div>
              {replayLog && <CombatReplay log={replayLog} />}
              {!validReplaySeed && <p role="alert">{displayedText.simulationInvalidSeed}</p>}
            </CardContent>
          </Card>
        </section>
      )}
    </div>
  );
}

function PolicyPicker({ label, name, onNameChange, script, onScriptChange }: {
  label: string;
  name: PolicyName;
  onNameChange: (v: PolicyName) => void;
  script: string;
  onScriptChange: (v: string) => void;
})
{
  const id = useId();
  return (
    <div className="flex flex-col gap-1">
      <Label htmlFor={id} className="text-xs text-muted-foreground">{label}</Label>
      <Select value={name} onValueChange={(v) => onNameChange(v as PolicyName)}>
        <SelectTrigger id={id} className="w-56"><SelectValue /></SelectTrigger>
        <SelectContent>
          {policyOptions().map(o => <SelectItem key={o.name} value={o.name}>{o.label}</SelectItem>)}
        </SelectContent>
      </Select>
      {name === "scripted" && (
        <Input
          className="mt-1 w-56"
          aria-label={`${label}: ${displayedText.simulationSequence}`}
          placeholder="Manewry po przecinku…"
          value={script}
          onChange={e => onScriptChange(e.target.value)}
        />
      )}
    </div>
  );
}

