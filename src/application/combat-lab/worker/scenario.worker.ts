/** Scenario Web Worker: runs the matchup under each scenario off the main thread. */

import { compareScenarios } from "@/domain/combat-lab/scenario/scenario";
import { resolvePolicy } from "@/application/combat-lab/worker/policyResolver";
import type { ScenarioWorkerRequest, ScenarioWorkerResponse } from "@/application/combat-lab/worker/scenarioMessages";

const ctx = self as unknown as Worker;

ctx.addEventListener("message", (event: MessageEvent<ScenarioWorkerRequest>) =>
{
  const request = event.data;

  try
  {
    const report = compareScenarios(
      request.a,
      request.b,
      request.scenarios,
      {
        count: request.count,
        seedStart: request.seedStart,
        policyA: resolvePolicy(request.policyA),
        policyB: resolvePolicy(request.policyB),
      },
      (completed, total) => post({ type: "progress", completed, total }),
    );
    post({ type: "done", report });
  }
  catch (error)
  {
    post({ type: "error", message: error instanceof Error ? error.message : String(error) });
  }
});

function post(message: ScenarioWorkerResponse): void
{
  ctx.postMessage(message);
}
