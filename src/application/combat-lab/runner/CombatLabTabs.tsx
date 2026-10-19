"use client";

import type { ComponentType, ReactNode } from "react";
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
import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/ui/select";

// Register built-in plugins on the main thread (workers load them separately).
loadPlugins();

type TabDef = { value: string; label: string; description: string; Component: ComponentType };

const TABS: TabDef[] = [
  {
    value: "new", label: "Nowa symulacja", Component: SimulationRunner,
    description: "Uruchom pojedynczy matchup A vs B na tysiącach deterministycznych walk. Wybierz dwie postacie (z wzmocnieniami na czas symulacji), strategie i liczbę walk → podsumowanie, statystyki, zapis biegu i podgląd pojedynczej walki (Replay).",
  },
  {
    value: "matchups", label: "Matchupy", Component: MatchupAnalyzer,
    description: "Macierz N×N Win Rate dla wielu postaci naraz — które buildy mają słabe, a które mocne starcia. Dodaj postacie do rosteru, ustaw liczbę walk na parę → heatmapa (zielony = przewaga atakującego).",
  },
  {
    value: "balance", label: "Balans", Component: BalanceAnalyzer,
    description: "Statyczny profil buildów na 6 wymiarach (obrażenia, przeżywalność, kontrola, ekonomia, utility, mobilność) na radarze + ranking. Liczone ze snapshotu, bez symulacji — natychmiastowe.",
  },
  {
    value: "meta", label: "Meta", Component: MetaAnalyzer,
    description: "Round-robin po całym rosterze: ranking buildów wg średniego Win Rate oraz najczęściej używane i nigdy niewybierane manewry. Dodaj co najmniej 2 postacie i policz metę.",
  },
  {
    value: "synergy", label: "Synergia", Component: SynergyAnalyzer,
    description: "Wkład każdego manewru badanej postaci w Win Rate — przez ablację (walka z manewrem i bez niego). Dodatni wkład = manewr pracuje na wygraną; bliski zera = kandydat do wycięcia.",
  },
  {
    value: "combos", label: "Kombinacje", Component: ComboAnalyzer,
    description: "Graf następstw manewr→manewr z wielu walk: najczęstsze łańcuchy. Widoczny, gdy manewry mają efekty lub użyjesz strategii skryptowanej — w przeciwnym razie polityki ich nie wybierają.",
  },
  {
    value: "scenarios", label: "Scenariusze", Component: ScenarioBuilder,
    description: "Ten sam matchup w różnych środowiskach (Arena / Korytarz / Las / Boss / Oblężenie): jak scenariusz zmienia Win Rate. Zaznacz scenariusze i porównaj w tabeli.",
  },
  {
    value: "validator", label: "Walidator", Component: RulesValidatorPanel,
    description: "Statyczna kontrola manewrów wybranych postaci: martwe mechaniki (brak efektów), złe odwołania do profili buffów, puste efekty, zerowe czasy trwania, duplikaty nazw, ujemny cooldown.",
  },
  {
    value: "tuning", label: "Strojenie", Component: ParameterTuning,
    description: "Globalne Δ parametrów (obrażenia, ranga kości, krytyk, obrona, HP) nakładane na strojoną postać — z automatycznym przeliczaniem porównania Win Rate baseline vs strojone.",
  },
  {
    value: "explorer", label: "Kalkulator", Component: ProbabilityExplorer,
    description: "Kalkulator pojedynczej wymiany: zmień jedną wartość (atak / obrona / dystans) i zobacz na żywo wpływ na obrażenia, szansę trafienia i krytyka, rozkład obrażeń oraz liczbę trafień do zabicia.",
  },
  {
    value: "saved", label: "Zapisane biegi", Component: SavedRunsList,
    description: "Lista zapisanych biegów symulacji — otwórz podsumowanie, odtwórz dowolną walkę (Replay) i pobierz raport PDF.",
  },
];

export function CombatLabTabs()
{
  const analyzers = pluginAnalyzers();
  const [activeTab, setActiveTab] = useState('new');

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full min-w-0">
      <div className="sm:hidden">
        <Select value={activeTab} onValueChange={setActiveTab}>
          <SelectTrigger aria-label="Widok laboratorium" className="w-full"><SelectValue /></SelectTrigger>
          <SelectContent>
            {TABS.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
            {analyzers.map(a => <SelectItem key={a.id} value={`plugin:${a.id}`}>{a.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <TabsList className="hidden flex-wrap overflow-visible sm:flex">
        {TABS.map(t => <TabsTrigger key={t.value} value={t.value}>{t.label}</TabsTrigger>)}
        {analyzers.map(a => <TabsTrigger key={a.id} value={`plugin:${a.id}`}>{a.label}</TabsTrigger>)}
      </TabsList>

      {TABS.map(({ value, description, Component }) => (
        <TabsContent key={value} value={value} className="mt-6">
          <TabIntro>{description}</TabIntro>
          <Component />
        </TabsContent>
      ))}

      {analyzers.map(a => (
        <TabsContent key={a.id} value={`plugin:${a.id}`} className="mt-6">
          <TabIntro>{`Zakładka pluginu: ${a.label}.`}</TabIntro>
          <a.component />
        </TabsContent>
      ))}
    </Tabs>
  );
}

function TabIntro({ children }: { children: ReactNode })
{
  return (
    <p className="mb-4 rounded-md border bg-muted/40 px-4 py-2 text-sm text-muted-foreground">
      {children}
    </p>
  );
}
