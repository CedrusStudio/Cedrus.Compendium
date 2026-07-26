/**
 * Resolve a serializable `PolicySpec` (crossed the worker boundary) back into a
 * live `ActionPolicy`.
 */

import type { ActionPolicy } from "@/domain/combat-lab/engine/ai/policy";
import { greedyDamagePolicy, valuePolicy, basicAttackPolicy, scriptedPolicy } from "@/domain/combat-lab/engine/ai/policy";
import { getPolicyPlugin } from "@/domain/combat-lab/plugins/registry";
import type { PolicySpec } from "@/application/combat-lab/worker/simulationMessages";

export function resolvePolicy(spec: PolicySpec | undefined): ActionPolicy | undefined
{
  if (!spec) return undefined;

  switch (spec.name)
  {
    case "greedyDamage":
      return greedyDamagePolicy;
    case "value":
      return valuePolicy;
    case "basicAttack":
      return basicAttackPolicy;
    case "scripted":
      return "sequence" in spec ? scriptedPolicy(spec.sequence) : scriptedPolicy([]);
    default:
      // Plugin-provided policy, resolved by name from the registry.
      return getPolicyPlugin(spec.name)?.create("config" in spec ? spec.config : undefined);
  }
}
