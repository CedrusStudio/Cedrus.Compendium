/** Message protocol for the combo Web Worker. */

import type { CombatantSnapshot } from "@/domain/combat-lab/engine/CombatantSnapshot";
import type { ComboGraph } from "@/domain/combat-lab/analysis/combo";
import type { PolicySpec } from "@/application/combat-lab/worker/simulationMessages";

export type ComboWorkerRequest =
{
  a: CombatantSnapshot;
  b: CombatantSnapshot;
  count: number;
  seedStart?: number;
  maxRounds?: number;
  policyA?: PolicySpec;
  policyB?: PolicySpec;
};

export type ComboWorkerResponse =
  | { type: "progress"; completed: number; total: number }
  | { type: "done"; graph: ComboGraph }
  | { type: "error"; message: string };
