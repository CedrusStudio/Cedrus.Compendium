/**
 * Combo Web Worker: runs fights, collects their logs, and builds the combo graph
 * off the main thread. Only the (small) graph crosses back — the (large) logs
 * stay in the worker.
 */

import { runCombat } from "@/domain/combat-lab/engine/runCombat";
import { computeComboGraph } from "@/domain/combat-lab/analysis/combo";
import type { CombatLog } from "@/domain/combat-lab/engine/CombatLog";
import { resolvePolicy } from "@/application/combat-lab/worker/policyResolver";
import type { ComboWorkerRequest, ComboWorkerResponse } from "@/application/combat-lab/worker/comboMessages";

const ctx = self as unknown as Worker;

ctx.addEventListener("message", (event: MessageEvent<ComboWorkerRequest>) =>
{
  const request = event.data;

  try
  {
    const seedStart = request.seedStart ?? 0;
    const policyA = resolvePolicy(request.policyA);
    const policyB = resolvePolicy(request.policyB);
    const logs: CombatLog[] = [];

    const progressInterval = Math.max(1, Math.floor(request.count / 50));
    for (let i = 0; i < request.count; i++)
    {
      logs.push(runCombat(request.a, request.b, { seed: seedStart + i, policyA, policyB, maxRounds: request.maxRounds }));
      if (i % progressInterval === 0) post({ type: "progress", completed: i, total: request.count });
    }
    post({ type: "progress", completed: request.count, total: request.count });

    post({ type: "done", graph: computeComboGraph(logs) });
  }
  catch (error)
  {
    post({ type: "error", message: error instanceof Error ? error.message : String(error) });
  }
});

function post(message: ComboWorkerResponse): void
{
  ctx.postMessage(message);
}
