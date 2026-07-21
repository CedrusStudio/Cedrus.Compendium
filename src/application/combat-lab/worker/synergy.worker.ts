/**
 * Synergy Web Worker: runs the ablation (baseline + one run per maneuver
 * removed) off the main thread, posting progress per run.
 */

import { computeSynergy } from "@/domain/combat-lab/analysis/synergy";
import { resolvePolicy } from "@/application/combat-lab/worker/policyResolver";
import type { SynergyWorkerRequest, SynergyWorkerResponse } from "@/application/combat-lab/worker/synergyMessages";

import { loadPlugins } from "@/domain/combat-lab/plugins/loadPlugins";

loadPlugins();

const ctx = self as unknown as Worker;

ctx.addEventListener("message", (event: MessageEvent<SynergyWorkerRequest>) =>
{
  const request = event.data;

  try
  {
    const report = computeSynergy(
      request.subject,
      request.opponent,
      {
        count: request.count,
        seedStart: request.seedStart,
        maxRounds: request.maxRounds,
        subjectPolicy: resolvePolicy(request.subjectPolicy),
        opponentPolicy: resolvePolicy(request.opponentPolicy),
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

function post(message: SynergyWorkerResponse): void
{
  ctx.postMessage(message);
}
