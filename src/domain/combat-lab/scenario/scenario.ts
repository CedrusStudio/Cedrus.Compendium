/**
 * Scenario Builder: a fight environment that shifts balance. A scenario bundles
 * engagement distance, a round limit, per-side parameter modifiers and hp
 * multipliers, so the SAME matchup can be replayed under different conditions
 * (open arena vs. tight corridor vs. boss fight).
 *
 * Nv N group combat and siege crowds need a multi-combatant engine (we're 1v1),
 * so those are approximated with parameters / left for the future.
 *
 * Pure domain, built on `runSimulation`; deterministic.
 */

import type { CombatantSnapshot } from "@/domain/combat-lab/engine/CombatantSnapshot";
import type { ActionPolicy } from "@/domain/combat-lab/engine/ai/policy";
import { runSimulation } from "@/domain/combat-lab/simulation/runSimulation";
import { applyOverrides, NO_OVERRIDES, type ParameterOverrides } from "@/domain/combat-lab/tuning/parameters";

export type Scenario =
{
  id: string;
  name: string;
  description: string;
  /** Ranged to-hit ST from distance (rulebook table: Blisko 3 / Normalny 5 / Daleki 8). */
  distanceST: number;
  maxRounds: number;
  aOverrides: ParameterOverrides;
  bOverrides: ParameterOverrides;
  aHpMultiplier: number;
  bHpMultiplier: number;
};

const override = (partial: Partial<ParameterOverrides>): ParameterOverrides => ({ ...NO_OVERRIDES, ...partial });

export const SCENARIO_PRESETS: Scenario[] = [
  { id: "arena", name: "Arena", description: "Otwarty teren, dystans normalny — neutralny punkt odniesienia.", distanceST: 5, maxRounds: 100, aOverrides: NO_OVERRIDES, bOverrides: NO_OVERRIDES, aHpMultiplier: 1, bHpMultiplier: 1 },
  { id: "corridor", name: "Korytarz", description: "Ciasno — trudniej unikać (−unik), walka z bliska.", distanceST: 3, maxRounds: 100, aOverrides: override({ dodge: -2 }), bOverrides: override({ dodge: -2 }), aHpMultiplier: 1, bHpMultiplier: 1 },
  { id: "forest", name: "Las", description: "Osłona i większy dystans (+unik, dalej).", distanceST: 8, maxRounds: 100, aOverrides: override({ dodge: 2 }), bOverrides: override({ dodge: 2 }), aHpMultiplier: 1, bHpMultiplier: 1 },
  { id: "boss", name: "Boss", description: "Przeciwnik (B) z potrójnym HP i mocniejszym atakiem.", distanceST: 5, maxRounds: 150, aOverrides: NO_OVERRIDES, bOverrides: override({ damageBonus: 3 }), aHpMultiplier: 1, bHpMultiplier: 3 },
  { id: "siege", name: "Oblężenie", description: "Długie starcie, obrońca (A) w przewadze obronnej.", distanceST: 8, maxRounds: 200, aOverrides: override({ protection: 2 }), bOverrides: NO_OVERRIDES, aHpMultiplier: 1, bHpMultiplier: 1 },
];

function scaleHp(snapshot: CombatantSnapshot, multiplier: number): CombatantSnapshot
{
  if (multiplier === 1) return snapshot;
  return { ...snapshot, maxHp: Math.max(1, Math.round(snapshot.maxHp * multiplier)) };
}

/** Apply a scenario to a matchup, returning adjusted snapshots + fight settings. */
export function applyScenario(a: CombatantSnapshot, b: CombatantSnapshot, scenario: Scenario): { a: CombatantSnapshot; b: CombatantSnapshot; distanceST: number; maxRounds: number }
{
  return {
    a: scaleHp(applyOverrides(a, scenario.aOverrides), scenario.aHpMultiplier),
    b: scaleHp(applyOverrides(b, scenario.bOverrides), scenario.bHpMultiplier),
    distanceST: scenario.distanceST,
    maxRounds: scenario.maxRounds,
  };
}

export type ScenarioOutcome =
{
  scenarioId: string;
  scenarioName: string;
  winRateA: number;
  winRateB: number;
  draws: number;
  averageRounds: number;
};

export type ScenarioReport =
{
  aName: string;
  bName: string;
  rows: ScenarioOutcome[];
  count: number;
};

export type ScenarioOptions =
{
  count: number;
  seedStart?: number;
  policyA?: ActionPolicy;
  policyB?: ActionPolicy;
};

/** Run the A-vs-B matchup under each scenario and report win rates side by side. */
export function compareScenarios(
  a: CombatantSnapshot,
  b: CombatantSnapshot,
  scenarios: Scenario[],
  options: ScenarioOptions,
  onProgress?: (done: number, total: number) => void,
): ScenarioReport
{
  let done = 0;
  const rows: ScenarioOutcome[] = scenarios.map(scenario =>
  {
    const applied = applyScenario(a, b, scenario);
    const { summary } = runSimulation({
      a: applied.a,
      b: applied.b,
      count: options.count,
      seedStart: options.seedStart ?? 0,
      policyA: options.policyA,
      policyB: options.policyB,
      maxRounds: applied.maxRounds,
    });
    done += 1;
    onProgress?.(done, scenarios.length);
    return {
      scenarioId: scenario.id,
      scenarioName: scenario.name,
      winRateA: summary.winRates[applied.a.id] ?? 0,
      winRateB: summary.winRates[applied.b.id] ?? 0,
      draws: summary.draws,
      averageRounds: summary.averageRounds,
    };
  });

  return { aName: a.name, bName: b.name, rows, count: options.count };
}
