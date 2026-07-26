/** Message protocol for the scenario Web Worker. */

import type { CombatantSnapshot } from "@/domain/combat-lab/engine/CombatantSnapshot";
import type { Scenario, ScenarioReport } from "@/domain/combat-lab/scenario/scenario";
import type { PolicySpec } from "@/application/combat-lab/worker/simulationMessages";

export type ScenarioWorkerRequest =
{
  a: CombatantSnapshot;
  b: CombatantSnapshot;
  scenarios: Scenario[];
  count: number;
  seedStart?: number;
  policyA?: PolicySpec;
  policyB?: PolicySpec;
};

export type ScenarioWorkerResponse =
  | { type: "progress"; completed: number; total: number }
  | { type: "done"; report: ScenarioReport }
  | { type: "error"; message: string };
