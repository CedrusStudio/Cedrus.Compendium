/** Message protocol for the meta Web Worker. */

import type { CombatantSnapshot } from "@/domain/combat-lab/engine/CombatantSnapshot";
import type { MetaReport } from "@/domain/combat-lab/analysis/meta";
import type { PolicySpec } from "@/application/combat-lab/worker/simulationMessages";

export type MetaWorkerEntry = { snapshot: CombatantSnapshot; policy?: PolicySpec };

export type MetaWorkerRequest =
{
  entries: MetaWorkerEntry[];
  count: number;
  seedStart?: number;
  maxRounds?: number;
};

export type MetaWorkerResponse =
  | { type: "progress"; completed: number; total: number }
  | { type: "done"; report: MetaReport }
  | { type: "error"; message: string };
