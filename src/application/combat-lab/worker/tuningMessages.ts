/** Message protocol for the tuning Web Worker. */

import type { CombatantSnapshot } from "@/domain/combat-lab/engine/CombatantSnapshot";
import type { ParameterOverrides, TuningResult } from "@/domain/combat-lab/tuning/parameters";
import type { PolicySpec } from "@/application/combat-lab/worker/simulationMessages";

export type TuningWorkerRequest =
{
  subject: CombatantSnapshot;
  opponent: CombatantSnapshot;
  overrides: ParameterOverrides;
  count: number;
  seedStart?: number;
  maxRounds?: number;
  subjectPolicy?: PolicySpec;
  opponentPolicy?: PolicySpec;
};

export type TuningWorkerResponse =
  | { type: "done"; result: TuningResult }
  | { type: "error"; message: string };
