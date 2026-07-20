/**
 * Simulation Web Worker. Runs the (pure, deterministic) simulation loop off the
 * main thread so the UI stays responsive during 100k-fight runs, posting
 * progress updates as it goes.
 *
 * Instantiate from the UI with:
 *   new Worker(new URL("./simulation.worker.ts", import.meta.url))
 * (Next.js / Turbopack bundles this automatically.)
 */

import { runSimulation } from "@/domain/combat-lab/simulation/runSimulation";
import { resolvePolicy } from "@/application/combat-lab/worker/policyResolver";
import type {
  SimulationWorkerRequest,
  SimulationWorkerResponse,
} from "@/application/combat-lab/worker/simulationMessages";

const ctx = self as unknown as Worker;

ctx.addEventListener("message", (event: MessageEvent<SimulationWorkerRequest>) =>
{
  const request = event.data;

  try
  {
    const { results, summary } = runSimulation(
      {
        a: request.a,
        b: request.b,
        count: request.count,
        seedStart: request.seedStart,
        policyA: resolvePolicy(request.policyA),
        policyB: resolvePolicy(request.policyB),
        maxRounds: request.maxRounds,
      },
      (completed, total) => post({ type: "progress", completed, total }),
    );

    post({
      type: "done",
      summary,
      results: request.includeResults === false ? [] : results,
    });
  }
  catch (error)
  {
    post({ type: "error", message: error instanceof Error ? error.message : String(error) });
  }
});

function post(message: SimulationWorkerResponse): void
{
  ctx.postMessage(message);
}
