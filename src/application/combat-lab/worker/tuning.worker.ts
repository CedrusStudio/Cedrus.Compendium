/** Tuning Web Worker: runs baseline + tuned simulations and returns the comparison. */

import { compareTuning } from "@/domain/combat-lab/tuning/parameters";
import { resolvePolicy } from "@/application/combat-lab/worker/policyResolver";
import type { TuningWorkerRequest, TuningWorkerResponse } from "@/application/combat-lab/worker/tuningMessages";

import { loadPlugins } from "@/domain/combat-lab/plugins/loadPlugins";

loadPlugins();

const ctx = self as unknown as Worker;

ctx.addEventListener("message", (event: MessageEvent<TuningWorkerRequest>) =>
{
  const request = event.data;

  try
  {
    const result = compareTuning(request.subject, request.opponent, request.overrides, {
      count: request.count,
      seedStart: request.seedStart,
      maxRounds: request.maxRounds,
      subjectPolicy: resolvePolicy(request.subjectPolicy),
      opponentPolicy: resolvePolicy(request.opponentPolicy),
    });
    post({ type: "done", result });
  }
  catch (error)
  {
    post({ type: "error", message: error instanceof Error ? error.message : String(error) });
  }
});

function post(message: TuningWorkerResponse): void
{
  ctx.postMessage(message);
}
