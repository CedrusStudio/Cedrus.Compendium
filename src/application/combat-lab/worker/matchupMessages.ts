/**
 * Message protocol for the matchup Web Worker. Policies cross the boundary by
 * name (`PolicySpec`), same as the simulation worker.
 */

import type { CombatantSnapshot } from "@/domain/combat-lab/engine/CombatantSnapshot";
import type { MatchupMatrix } from "@/domain/combat-lab/analysis/matchup";
import type { PolicySpec } from "@/application/combat-lab/worker/simulationMessages";

export type MatchupWorkerEntry =
{
  snapshot: CombatantSnapshot;
  policy?: PolicySpec;
};

export type MatchupWorkerRequest =
{
  entries: MatchupWorkerEntry[];
  count: number;
  seedStart?: number;
  maxRounds?: number;
};

export type MatchupWorkerResponse =
  | { type: "progress"; completed: number; total: number }
  | { type: "done"; matrix: MatchupMatrix }
  | { type: "error"; message: string };
