/**
 * Message protocol for the synergy Web Worker. Policies cross the boundary by
 * name (`PolicySpec`), same as the other workers.
 */

import type { CombatantSnapshot } from "@/domain/combat-lab/engine/CombatantSnapshot";
import type { SynergyReport } from "@/domain/combat-lab/analysis/synergy";
import type { PolicySpec } from "@/application/combat-lab/worker/simulationMessages";

export type SynergyWorkerRequest =
{
  subject: CombatantSnapshot;
  opponent: CombatantSnapshot;
  count: number;
  seedStart?: number;
  maxRounds?: number;
  subjectPolicy?: PolicySpec;
  opponentPolicy?: PolicySpec;
};

export type SynergyWorkerResponse =
  | { type: "progress"; completed: number; total: number }
  | { type: "done"; report: SynergyReport }
  | { type: "error"; message: string };
