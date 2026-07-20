/**
 * Message protocol between the UI thread and the simulation Web Worker.
 *
 * Policies are functions and cannot cross the worker boundary, so they are
 * passed by NAME (+ optional scripted sequence) and resolved inside the worker
 * (see policyResolver.ts). Everything else here is plain, structured-clonable
 * data.
 */

import type { CombatantSnapshot } from "@/domain/combat-lab/engine/CombatantSnapshot";
import type { RawResult, SimulationSummary } from "@/domain/combat-lab/simulation/RawResult";

export type PolicySpec =
  | { name: "greedyDamage" }
  | { name: "value" }
  | { name: "basicAttack" }
  | { name: "scripted"; sequence: string[] };

export type SimulationWorkerRequest =
{
  a: CombatantSnapshot;
  b: CombatantSnapshot;
  count: number;
  seedStart?: number;
  policyA?: PolicySpec;
  policyB?: PolicySpec;
  maxRounds?: number;
  /**
   * When false, the worker returns only the summary (not the potentially huge
   * `RawResult[]`). Default true.
   */
  includeResults?: boolean;
};

export type SimulationWorkerResponse =
  | { type: "progress"; completed: number; total: number }
  | { type: "done"; summary: SimulationSummary; results: RawResult[] }
  | { type: "error"; message: string };
