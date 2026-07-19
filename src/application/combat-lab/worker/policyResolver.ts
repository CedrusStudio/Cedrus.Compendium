/**
 * Resolve a serializable `PolicySpec` (crossed the worker boundary) back into a
 * live `ActionPolicy`.
 */

import type { ActionPolicy } from "@/domain/combat-lab/engine/ai/policy";
import { greedyDamagePolicy, basicAttackPolicy, scriptedPolicy } from "@/domain/combat-lab/engine/ai/policy";
import type { PolicySpec } from "@/application/combat-lab/worker/simulationMessages";

export function resolvePolicy(spec: PolicySpec | undefined): ActionPolicy | undefined
{
  if (!spec) return undefined;

  switch (spec.name)
  {
    case "greedyDamage":
      return greedyDamagePolicy;
    case "basicAttack":
      return basicAttackPolicy;
    case "scripted":
      return scriptedPolicy(spec.sequence);
  }
}
