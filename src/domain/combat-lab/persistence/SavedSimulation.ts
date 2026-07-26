/**
 * Persisted shape of a simulation run. Thanks to the engine's determinism we do
 * NOT store fight logs — we store the two combatant snapshots + the seed range,
 * so any individual fight can be reproduced exactly by re-running `runCombat`
 * with `seedStart + i`. That keeps records tiny even for 100k-fight runs and
 * lets Combat Replay open any fight from a saved run.
 *
 * The doc's two concepts map onto one Mongo document:
 *   - "Simulation"       → `configuration` (inputs).
 *   - "SimulationResult" → `result` (aggregated `SimulationSummary`).
 */

import type { Entity } from "@/domain/Entity";
import type { CombatantSnapshot } from "@/domain/combat-lab/engine/CombatantSnapshot";
import type { SimulationSummary } from "@/domain/combat-lab/simulation/RawResult";

/** Serializable reference to an action policy (functions can't be persisted). */
export type SavedPolicy =
{
  /** Built-in name ("greedyDamage" | "value" | "basicAttack" | "scripted") or a plugin policy name. */
  name: string;
  /** Maneuver-name sequence for the "scripted" policy. */
  sequence?: string[];
  /** Config for a plugin policy. */
  config?: unknown;
};

export type SavedSimulationConfiguration =
{
  a: CombatantSnapshot;
  b: CombatantSnapshot;
  count: number;
  seedStart: number;
  maxRounds?: number;
  distanceST?: number;
  policyA?: SavedPolicy;
  policyB?: SavedPolicy;
};

export type SavedSimulation = Entity &
{
  configuration: SavedSimulationConfiguration;
  result: SimulationSummary;
  createdAt: Date;
  updatedAt: Date;
};

/** List-view row — avoids shipping the full config/result payloads. */
export type SavedSimulationSummaryRow = Pick<SavedSimulation, "id" | "name" | "createdAt" | "updatedAt">;
