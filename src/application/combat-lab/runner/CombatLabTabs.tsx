"use client";

import { SimulationRunner } from "@/application/combat-lab/runner/SimulationRunner";
import { SavedRunsList } from "@/application/combat-lab/runner/SavedRunsList";
import { MatchupAnalyzer } from "@/application/combat-lab/analysis/MatchupAnalyzer";
import { BalanceAnalyzer } from "@/application/combat-lab/analysis/BalanceAnalyzer";
import { ProbabilityExplorer } from "@/application/combat-lab/analysis/ProbabilityExplorer";
import { SynergyAnalyzer } from "@/application/combat-lab/analysis/SynergyAnalyzer";
import { ComboAnalyzer } from "@/application/combat-lab/analysis/ComboAnalyzer";
import { RulesValidatorPanel } from "@/application/combat-lab/validation/RulesValidatorPanel";
import { ParameterTuning } from "@/application/combat-lab/tuning/ParameterTuning";
import { ScenarioBuilder } from "@/application/combat-lab/scenario/ScenarioBuilder";
import { MetaAnalyzer } from "@/application/combat-lab/analysis/MetaAnalyzer";
import { loadPlugins } from "@/domain/combat-lab/plugins/loadPlugins";
import { pluginAnalyzers } from "@/application/combat-lab/plugins/analyzerRegistry";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/common/components/ui/tabs";

// Register built-in plugins on the main thread (workers load them separately).
loadPlugins();

export function CombatLabTabs()
{
  const analyzers = pluginAnalyzers();

  return (
    <Tabs defaultValue="new" className="w-full">
      <TabsList>
        <TabsTrigger value="new">Nowa symulacja</TabsTrigger>
        <TabsTrigger value="matchups">Matchupy</TabsTrigger>
        <TabsTrigger value="balance">Balans</TabsTrigger>
        <TabsTrigger value="meta">Meta</TabsTrigger>
        <TabsTrigger value="synergy">Synergia</TabsTrigger>
        <TabsTrigger value="combos">Kombinacje</TabsTrigger>
        <TabsTrigger value="scenarios">Scenariusze</TabsTrigger>
        <TabsTrigger value="validator">Walidator</TabsTrigger>
        <TabsTrigger value="tuning">Strojenie</TabsTrigger>
        <TabsTrigger value="explorer">Kalkulator</TabsTrigger>
        {analyzers.map(a => <TabsTrigger key={a.id} value={`plugin:${a.id}`}>{a.label}</TabsTrigger>)}
        <TabsTrigger value="saved">Zapisane biegi</TabsTrigger>
      </TabsList>
      <TabsContent value="new" className="mt-6">
        <SimulationRunner />
      </TabsContent>
      <TabsContent value="matchups" className="mt-6">
        <MatchupAnalyzer />
      </TabsContent>
      <TabsContent value="balance" className="mt-6">
        <BalanceAnalyzer />
      </TabsContent>
      <TabsContent value="meta" className="mt-6">
        <MetaAnalyzer />
      </TabsContent>
      <TabsContent value="synergy" className="mt-6">
        <SynergyAnalyzer />
      </TabsContent>
      <TabsContent value="combos" className="mt-6">
        <ComboAnalyzer />
      </TabsContent>
      <TabsContent value="scenarios" className="mt-6">
        <ScenarioBuilder />
      </TabsContent>
      <TabsContent value="validator" className="mt-6">
        <RulesValidatorPanel />
      </TabsContent>
      <TabsContent value="tuning" className="mt-6">
        <ParameterTuning />
      </TabsContent>
      <TabsContent value="explorer" className="mt-6">
        <ProbabilityExplorer />
      </TabsContent>
      {analyzers.map(a => (
        <TabsContent key={a.id} value={`plugin:${a.id}`} className="mt-6">
          <a.component />
        </TabsContent>
      ))}
      <TabsContent value="saved" className="mt-6">
        <SavedRunsList />
      </TabsContent>
    </Tabs>
  );
}
