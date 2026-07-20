/**
 * Reproduce a single fight from a saved simulation. Because the engine is
 * deterministic, the stored `configuration` + a seed fully determine the fight —
 * so Combat Replay can open any fight from a saved run without any logs having
 * been persisted.
 */

import type { SavedSimulationConfiguration, SavedPolicy } from "@/domain/combat-lab/persistence/SavedSimulation";
import type { CombatLog } from "@/domain/combat-lab/engine/CombatLog";
import type { ActionPolicy } from "@/domain/combat-lab/engine/ai/policy";
import { greedyDamagePolicy, valuePolicy, basicAttackPolicy, scriptedPolicy } from "@/domain/combat-lab/engine/ai/policy";
import { runCombat } from "@/domain/combat-lab/engine/runCombat";

export function resolveSavedPolicy(policy: SavedPolicy | undefined): ActionPolicy | undefined
{
  if (!policy) return undefined;
  switch (policy.name)
  {
    case "greedyDamage":
      return greedyDamagePolicy;
    case "value":
      return valuePolicy;
    case "basicAttack":
      return basicAttackPolicy;
    case "scripted":
      return scriptedPolicy(policy.sequence ?? []);
  }
}

/**
 * Rebuild the `CombatLog` for the fight at `seed` within a saved run's seed
 * range. Pass `configuration.seedStart + i` to get the i-th fight of the run.
 */
export function reproduceFight(configuration: SavedSimulationConfiguration, seed: number): CombatLog
{
  return runCombat(configuration.a, configuration.b, {
    seed,
    policyA: resolveSavedPolicy(configuration.policyA),
    policyB: resolveSavedPolicy(configuration.policyB),
    maxRounds: configuration.maxRounds,
    distanceST: configuration.distanceST,
  });
}
